/* ==========================================================================================
    日付計算 Copyright © (c) okoteiyu 2025
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
    return Math.floor((timecount(Y,Mo,D)-timecount(0,1,1))/86400);
}

// 0/1/1 0:00:00 から、sec 秒後の日付 ({Y,M,D,H,M,S})
function YMDHMS(sec){
    let res = [];
    let Y = 0;
    for(var y = 0 ; y < 10000; y++){
        if(timecount(y,1,1,0,0,0) > sec)break;
        Y = y;
    }
    res.push(Y);
    let M = 1;
    for(var m = 1 ; m <= 12; m++){
        if(timecount(res[0],m,1,0,0,0) > sec)break;
        M = m;
    }
    res.push(M);
    let D = 1;
    for(var d = 1 ; d <= datecount_for_month(res[0],res[1]); d++){
        if(timecount(res[0],res[1],d,0,0,0) > sec)break;
        D = d;
    }
    res.push(D);
    let H = 0;
    for(var h = 0 ; h <= 23; h++){
        if(timecount(res[0],res[1],res[2],h,0,0) > sec)break;
        H = h;
    }
    res.push(H);
    M = 0;
    for(var m = 0 ; m <= 59; m++){
        if(timecount(res[0],res[1],res[2],res[3],m,0) > sec)break;
        M = m;
    }
    res.push(M);
    let S = 0;
    for(var s = 0 ; s <= 59; s++){
        if(timecount(res[0],res[1],res[2],res[3],res[4],s) > sec)break;
        S = s;
    }
    res.push(S);
    return res;

}



// YYYY/MM/DD hh:mm:ss をタイムスタンプにパースする
function parseTimeStamp(str){
    const Y = parseInt(str.slice(0,4));
    const M = parseInt(str.slice(5,7));
    const D = parseInt(str.slice(8,10));
    const h = parseInt(str.slice(11,13));
    const m = parseInt(str.slice(14,16));
    const s = parseInt(str.slice(17,19));
    return timecount(Y,M,D,h,m,s);
}

// YYYY/MM/DD hh:mm:ss をタイムスタンプにパースする
function parseYMDHMS(str){
    return YMDHMS(parseTimeStamp(str));
}

