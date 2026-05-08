

/* ==========================================================================================
    記念日管理データ構造
========================================================================================== */

const AnniversaryManager = new class{
    constructor(){
        // 繰り返しイベント時の設定時に使用する年
        this.c_static_year = 0;

        // ここに直書きする
        // 同じ日のものは、一つにまとめて書く。(ただし、単発/繰り返しが異なるなら、別で書く。)
        this.solo_events = new Map();// 単発イベント
        this.repeat_events = new Map();// 繰り返しイベント

        // 単発イベント
        this.solo_events.set( datecount(2025,3,31),  "東京に来た!!!" );
        

        // 繰り返しイベント
        this.repeat_events.set( datecount(this.c_static_year, 1,1), "お正月!!");
        
        

    }

    // 何らかのイベントがあるかどうか
    is_event(y, mo, d){
        if(this.solo_events.has(datecount(y,mo,d)))return true;
        if(this.repeat_events.has(datecount(this.c_static_year,mo,d)))return true;
        return false;
    }

    // 単発イベント & 繰り返しイベント の文字列を取得
    event(y,mo,d){
        if(this.is_event(y,mo,d) == false)throw new Error("No Event");
        let res = "";
        if(this.solo_events.has(datecount(y,mo,d))){
            res += this.solo_events.get(datecount(y,mo,d));
            res += "[単発イベント]\n";
        }
        if(this.repeat_events.has(datecount(this.c_static_year,mo,d))){
            res += this.repeat_events.get(datecount(this.c_static_year,mo,d));
            res += "[繰り返しイベント]\n";
        }
        return res;
    }

}();























/* ==========================================================================================
    日付計算
========================================================================================== */


// Y 年 M 月の日数
function datecount_for_month(Y,Mo){
    // datecount for month [x] := x月の日数。ただし閏年ではない
    const d4m = [0,31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if(Mo == 2 && ((Y%4 == 0 && Y%100 != 0) || Y%400 == 0)){
        return d4m[Mo]+1;
    }
    return d4m[Mo];
}

// mod7 の値から、曜日を計算。月曜が 0 、日曜が 6
function weekday(id){
    const wd = ["Mon", "Tue", "Wed", "Thu" , "Fri", "Sut" , "Sun"];
    return wd[(id%7+7)%7];
}


// グレゴリオで、西暦 0 年 1 月 1 日 0 時 0 分 0 秒から、西暦 Y 年 Mo 月 D 日 H 時 Mi 分 S 秒までの経過時間を計算
// ただし、0/1/1 00:00:00 は数値計算用の絶対的な値として採用しているだけで、グレゴリオ歴は 1582 年スタートであることに注意
// 違反してはいけない
function timecount(Y , Mo , D , H = 0 , Mi = 0 , S = 0){
    // [x] := その年から x 月の初めまでの日数
    const accum_d4m = [0 , 0 , 31 , 59 , 90 , 120 , 151 , 181 , 212 , 243 , 273 , 304 , 334 , 365];

    const h4d = 24;// 一日あたりの時刻数
    const m4h = 60;// 一時間あたりの分数
    const s4m = 60;// 一分あたりの秒数

    let daycount = 0;
    if(Y>=1){
        daycount += Math.floor((Y-1)/400)*366 + (Math.floor((Y-1)/100)-Math.floor((Y-1)/400))*365 + (Math.floor((Y-1)/4)-Math.floor((Y-1)/100))*366 + ((Y-1)-Math.floor((Y-1)/4))*365;
    }
    daycount += accum_d4m[Mo] + D - 1;
    if(Mo > 2 && ((Y%4 == 0 && Y%100 != 0) || Y%400 == 0))daycount += 1;
    return daycount*h4d*m4h*s4m + H*m4h*s4m + Mi*s4m + S;
}

// 0/1/1 から　Y/Mo/D までの日数 (!!!Y/Mo/D を含まない!!!)
// つまり、0/1/1 から何日経過すると Y/Mo/D になるかを計算
function datecount(Y , Mo , D){
    return ((timecount(Y,Mo,D)-timecount(0,1,1))/86400);
}



/* ==========================================================================================
    カレンダー管理
========================================================================================== */


const CalendarManager = new class{
    constructor(){
        // セルの状態定数
        this.c_cell_invisible_val = "var(--calendar-invisible-cell-bg-color)";
        this.c_cell_visible_val = "var(--calendar-cell-bg-color)";
        this.c_special_cell_gbColor_val = "var(--calendar-special-cell-bg-color)";
        this.c_cell_class_val = "calendar_cell";
        this.c_special_cell_class_val = "calendar_special_cell";
        

        // カレンダーのグリッドサイズ
        this.c_height = 6;
        this.c_width = 7;

        // カレンダー要素
        this.m_calendar_elem = document.getElementById("CalendarField");

        // 年と月の情報を表示する要素
        this.m_display_field_elem = document.getElementById("YearMonthField");
        console.log(this.m_display_field_elem);

        // カレンダーの年と月
        const now = new Date();
        this.m_year_cursor = now.getFullYear();
        this.m_month_cursor = now.getMonth();

        // セル要素を一次元で管理
        this.m_date_elems = new Array(0);

        for(let i = 0 ; i < this.c_height ; i++){
            for(let j = 0 ; j < this.c_width ; j++){
                const new_date_elem = document.createElement('div');
                this.m_date_elems.push(new_date_elem);
                this.m_calendar_elem.appendChild(new_date_elem);

                // クリックで内容を表示
                new_date_elem.addEventListener("click", (e)=>{
                    if(String(e.target.innerText).length > 4)alert(e.target.innerText);
                });
            }
        }
        this.refresh_state();
    }

    // 諸々の情報の更新
    refresh_state(){
        this.m_display_field_elem.innerText = String(this.m_year_cursor) + " 年 " + String(this.m_month_cursor) + " 月";
        const cnt = datecount_for_month(this.m_year_cursor, this.m_month_cursor);

        this.m_date_elems.map( (x) =>{
            x.innerText = "";
            x.className = this.c_cell_class_val;
            x.style.backgroundColor = this.c_cell_invisible_val;
        });

        // カレンダーのセルは、weekday の id が -1, すなわち日曜日から始まる
        const first_day_weekdayID = datecount(this.m_year_cursor, this.m_month_cursor, 1)%7;
        const start_index = (first_day_weekdayID+1)%7;

        // 一つずつ
        for(let i = start_index ; i < start_index+cnt ; i++){
            this.m_date_elems[i].style.backgroundColor = this.c_cell_visible_val;
            const d = i - start_index+1;// day
            let is_specail = false;// 特別な日かどうか

            let date_text = String(d) + "日\n";

            if(AnniversaryManager.is_event(this.m_year_cursor,this.m_month_cursor, d)){
                date_text += AnniversaryManager.event(this.m_year_cursor,this.m_month_cursor, d);
                this.m_date_elems[i].className = this.c_special_cell_class_val;
                this.m_date_elems[i].style.backgroundColor = this.c_special_cell_gbColor_val;
            }

            this.m_date_elems[i].innerText = date_text;
        }
    }

    // 前の月へ
    go_back_month(){
        this.m_month_cursor--;
        if(this.m_month_cursor <= 0){
            this.m_year_cursor += Math.floor((this.m_month_cursor-12)/12);
            this.m_month_cursor = (this.m_month_cursor%12+12);
        }
        this.refresh_state();
    }

    // 次の月へ
    go_next_month(){
        this.m_month_cursor++;
        if(this.m_month_cursor >= 13){
            this.m_year_cursor += Math.floor(this.m_month_cursor/12);
            this.m_month_cursor %= 12;
        }
        this.refresh_state();
    }


    // 前の年へ
    go_back_year(){
        this.m_year_cursor--;
        this.refresh_state();
    }
    // 次の年へ
    go_next_year(){
        this.m_year_cursor++;
        this.refresh_state();
    }
}();