/* =================================================================================
    定数
================================================================================= */
const positive_inf = 1000000000;


/* =================================================================================
    ゲーム手続き全体での共通 API
================================================================================= */

// 盤面情報を取り扱う万能クラス。
// 真に盤面に直結する HTML 要素のみとリンク。
// 1 画面であればこのクラスだけでゲームが完結する。
// ゲームモードでは、プレイヤーも AI も、この API の手番の情報を参照して不整合が起こらないようにプレイする。
var BoardManager = new class {
    constructor(){
        /* const な値たち */

        // 状態の種類 (+リンク)
        this.c_state_val_none  = "url('"+document.getElementById("noImageLink").getAttribute('name')+"')";
        this.c_state_val_first = "url('"+document.getElementById("firstImageLink").getAttribute('name')+"')";
        this.c_state_val_second = "url('"+document.getElementById("secondImageLink").getAttribute('name')+"')";

        console.log(document.getElementById("secondImageLink"));
        console.log(this.c_state_val_first)
        console.log(this.c_state_val_second)

        // ボード関連の html 要素の参照
        this.m_board_element = document.getElementById("othellogame_boardID");

        // リセットボタン
        this.m_resetbutton_element = document.getElementById("othellogame_resetbuttonID");
        this.m_resetbutton_element.addEventListener("click", ()=>{
            let user_first = false;
            if(Math.random()*2 < 1)user_first = true;
            this.renew_state(true,user_first);
        });

        // メッセージ
        this.m_messageBox_element = document.getElementById("othellogame_messageBoxID");

        // パスボタン
        this.m_passbutton_element = document.getElementById("othellogame_passbuttonID");
        this.m_passbutton_element.addEventListener("click", ()=>this.pass_turn(false));

        // モード変更ボタン
        this.m_changemode_button_element = document.getElementById("othellogame_changemode_buttonID");
        this.m_changemode_button_element.addEventListener("click", ()=>this.change_mode(true));

        this.m_counter_element = document.getElementById("othellogame_counterID");
        this.m_nextInfo_element = document.getElementById("othellogame_nextInfoID");
        this.m_static_state_element = document.getElementById("othellogame_static_stateID");

        // 石の二次元配列 ({length:8} の配列にマッピングで初期化)
        this.m_stones = Array.from({length : 8}, ()=>Array(8).fill(null));
        this.m_gametime = 0;// 経過ターン数 (次の手番のターンは gametime+1)
        this.m_passcount = 0;// パスの回数
        // 最後に置かれた石(パスも置いたこととする)
        this.m_last_placed_stone = null;
        this.m_is_end = false;

        // 同期をとるため、ユーザからの操作をブロックするためのフラグ。
        this.m_userOp_lock = 0;// ブロッキングが呼ばれている回数
        this.m_mutex = false;// 特定の関数の実行を単位とするロック

        // ゲームモードと、プレイヤーがどちらの手番か。これによって、ユーザ操作の制限が変わる.
        this.c_free_mode_val = "FREE_MODE";
        this.c_battle_mode_val = "BATTLE_MODE";

        this.m_game_mode = this.c_free_mode_val;
        // バトルモードにおけるプレイヤーの石の色
        this.m_player_color = this.c_state_val_first;

        // 初期化処理
        for(var i = 0 ; i < 8 ; i++){
            for(var j = 0 ; j < 8 ; j++){
                const new_stone_elem = document.createElement('div');
                new_stone_elem.className = "stone";
                // STONE_ID_PREFIX_AND[Y][X] の構文で命名
                new_stone_elem.id = "STONE_ID_PREFIX_AND"+String(i)+String(j);
                // クリックイベントを定義
                new_stone_elem.addEventListener("click", (event)=>this.react(event));
                
                this.m_board_element.appendChild(new_stone_elem);
                this.m_stones[i][j] = new_stone_elem;
            }
        }
        let user_first = false;
        if(Math.random()*2 < 1)user_first = true;
        this.renew_state(false, user_first);
        this.change_to_battle_mode(false);
    }




    // 盤面を最初の状態に戻す (引数は、確認を行うかどうかと、人間を先手にするかどうか)
    // バトルモードの場合、手番もここで決める
    renew_state(confirm_, user_first){
        if(this.m_userOp_lock > 0)return;
        // 確認
        if(confirm_){
            const result = confirm("本当にゲームをリセットしますか？");
            if (!result) return;
        }
        
        for(var i = 0 ; i < 8 ; i++){
            for(var j = 0 ; j < 8 ; j++){
                this.raw_set_none(i,j);
            }
        }
        this.raw_set_second(3,3);
        this.raw_set_second(4,4);
        this.raw_set_first(4,3);
        this.raw_set_first(3,4);
        this.m_gametime = 0;
        this.m_passcount = 0;
        this.m_is_end = false;
        this.m_last_placed_stone = null;
        this.set_message("盤面の初期化が完了しました。");

        if(this.is_free_mode()){
            this.set_static_state("フリープレイモード");
        }
        if(this.is_battle_mode()){
            this.m_last_placed_stone = this.c_state_val_second;

            if(user_first){
                this.m_player_color = this.c_state_val_first;
                this.set_static_state("AI 対戦 (あなた:[前])");
            }else{
                this.m_player_color = this.c_state_val_second;
                this.set_static_state("AI 対戦 (あなた:[後])");
            }
        }
        this.refresh_state();
    }

    // 石をクリックしたときの反応。
    react(e){
        if(this.m_mutex)return;
        this.m_mutex = true;// 全ての終了スコープでロックを解除する必要がある
        if(this.m_userOp_lock > 0){
            this.m_mutex = false;
            return;
        }

        // バトルモードかつ自分の手番でなければ無視する
        if(this.m_game_mode == this.c_battle_mode_val){
            if(this.m_player_color != this.next_stone_state()){
                this.set_message("相手の番なの〜");
                this.m_mutex = false;
                return;
            }
        }

        const [i, j] = this.get_place(e.target);   
        if(this.is_none(i,j) == false){
            this.m_mutex = false;
            return;
        }
        
        const result = this.put_stone(i,j);
        if(result == 0){
            this.set_message("そこには置けないの〜");
        }else{
            this.set_message(String(result) + " 個置けたの〜");
        }
        this.m_mutex = false;
    }

    // 次の手番が、石を置ける場所があるかどうか
    placeable(){
        var res = false;
        for(var i = 0 ; i < 8 ; i++){
            for(var j = 0 ; j < 8 ; j++){
                if(this.placeable_at(i,j))res = true;
            }
        }
        return res;
    }

    // 次の手番が、(i,j) に石を置けるかどうか
    placeable_at(i,j){
        if(this.next_turn()%2 == 1){// 次が先手の場合
            return this.placeable_first(i,j);
        }
        return this.placeable_second(i,j);
    }


    // (i,j) に second を置くことができるかどうか
    placeable_second(i,j){
        if(this.is_none(i,j) == false)return false;
        if(this.calc_future_second(i,j) == 0)return false;
        return true;
    }
    // (i,j) に first を置くことができるかどうか
    placeable_first(i,j){
        if(this.is_none(i,j) == false)return false;
        if(this.calc_future_first(i,j) == 0)return false;
        return true;
    }

    // ターンをパスする (引数は、本来パスできない場合もパスさせるかどうか)
    pass_turn(forced){
        if(this.m_mutex)return;
        this.m_mutex = true;// 全ての終了スコープでロックを解除する必要がある

        if(this.m_userOp_lock > 0){
            this.m_mutex = false;
            return;
        }

        const next_stone = this.next_stone_state();
        if(this.is_next_player_AI() && (forced == false)){
            this.set_message("今は相手の番なの〜");
            this.m_mutex = false;
            return;
        }
        if(this.placeable() && (forced == false)){
            this.set_message("まだ置ける場所があるの〜");
            this.m_mutex = false;
            return;
        }
        
        this.m_last_placed_stone = next_stone;
        this.m_gametime++;
        this.m_passcount++;
        this.refresh_state();
        this.m_mutex = false;
    }

    // ゲーム進行メッセージを設定する
    set_message(msg){
        this.m_messageBox_element.innerText = msg;
    }

    // ゲームの静的状態 (先手/後手 など) を設定する
    set_static_state(msg){
        this.m_static_state_element.innerText = msg;
    }

    // 現在の盤面から得られる情報から集計を行い、HTML 要素などに反映する。
    refresh_state(){
        var first_count = 0;
        var second_count = 0;
        
        var put_able_count_second = 0;// 配置可能な場所の個数
        var put_able_count_first = 0;// 配置可能な場所の個数

        for(var i = 0 ; i < 8 ; i++){
            for(var j = 0 ; j < 8 ; j++){
                if(this.is_first(i,j))first_count++;
                else if(this.is_second(i,j))second_count++;
                else {
                    if(this.placeable_first(i,j))put_able_count_first++;
                    if(this.placeable_second(i,j))put_able_count_second++;
                }
            }
        }

        this.m_counter_element.innerText = "[前]:" + String(first_count) + " / [後]:" + String(second_count);
        if(this.next_stone_state() == this.c_state_val_first){
            this.m_nextInfo_element.innerText = "次 : [前]";
        }else{
            this.m_nextInfo_element.innerText = "次 : [後]";
        }

        // ゲーム終了
        if(put_able_count_second + put_able_count_first == 0){
            var end_message = "終了〜!!! ";
            if(first_count > second_count)end_message += "[前]の勝ち🌟";
            if(first_count < second_count)end_message += "[後]の勝ち🌟";
            if(first_count == second_count)end_message += "引き分け🌟";
            this.set_message(end_message);
            this.m_is_end = true;
        }
    }

    // 呼び出し時点から ms ミリ秒間、ユーザからの操作をブロックする。
    // ブロッキングは蓄積せず、(呼び出し時点から)もっとも遅い解除タイミングまでブロックされる。
    block_userOp(ms){
        this.m_userOp_lock++;
        setTimeout(() => {this.m_userOp_lock--;}, ms);
    }

    // (i,j) が盤面内かどうかを boolean で返す
    isin(i,j){
        if(i < 0)return false;
        if(i >= 8)return false;
        if(j < 0)return false;
        if(j >= 8)return false;
        return true;
    }

    // マス (i,j) が有効かどうかを確認し、無効ならエラーを投げる。
    check_error(i,j){
        if(!this.isin(i,j)){
            throw new Error("error : outofindex");
        }
    }

    // stone 要素からマス目情報を取得
    get_place(stone_e){
        const id = stone_e.id;
        return Array.from({length:2}, (_,i)=>Number(id.charAt(id.length - 2 + i)));
    }

    // (i,j) の石が none かどうか
    is_none(i,j){
        this.check_error(i,j); // 有効性チェック
        if(this.m_stones[i][j].getAttribute("name") == this.c_state_val_none)return true;
        return false;
    }
    // (i,j) の石が second かどうか
    is_second(i,j){
        this.check_error(i,j); // 有効性チェック
        if(this.m_stones[i][j].getAttribute("name") == this.c_state_val_second)return true;
        return false;
    }
    // (i,j) の石が first かどうか
    is_first(i,j){
        this.check_error(i,j); // 有効性チェック
        if(this.m_stones[i][j].getAttribute("name") == this.c_state_val_first)return true;
        return false;
    }

    // 盤面データを直接 none に変更する。すなわち、他の石の反転などは行われない。
    raw_set_none(i , j){
        this.check_error(i,j); // 有効性チェック
        this.m_stones[i][j].style.backgroundImage = this.c_state_val_none;
        // css の API からは生の文字列として保存されないため
        this.m_stones[i][j].setAttribute('name',this.c_state_val_none);
    }
    // 盤面データを直接 second に変更する。すなわち、他の石の反転などは行われない。
    raw_set_second(i , j){
        this.check_error(i,j); // 有効性チェック
        this.m_stones[i][j].style.backgroundImage = this.c_state_val_second;
        // css の API からは生の文字列として保存されないため
        this.m_stones[i][j].setAttribute('name',this.c_state_val_second);
    }

    // 盤面データを直接 first に変更する。すなわち、他の石の反転などは行われない。
    raw_set_first(i , j){
        this.check_error(i,j); // 有効性チェック
        this.m_stones[i][j].style.backgroundImage = this.c_state_val_first;
        // css の API からは生の文字列として保存されないため
        this.m_stones[i][j].setAttribute('name',this.c_state_val_first);

    }

    // (i,j) の石を反転する
    flip(i,j){
        this.check_error();
        if(this.is_none(i,j))throw new Error("error : invalid use(flipping null)");

        if(this.is_first(i,j)){
            this.m_stones[i][j].style.animation = "turn_stone_animation 300ms linear";
            this.raw_set_second(i,j);// 状態の更新は JS の仕事
            return;
        }
        if(this.is_second(i,j)){
            this.m_stones[i][j].style.animation = "turn_stone_animation 300ms linear";
            this.raw_set_first(i,j);// 状態の更新は JS の仕事
            return;
        }
        throw new Error("error : undefined state");
    }

    // 次の手番のターン数 (%2 で先手後手を判定する)
    next_turn(){
        return this.m_gametime+1;
    }

    // 次に置く石の色(状態)
    next_stone_state(){
        if(this.m_last_placed_stone != this.c_state_val_first)return this.c_state_val_first;
        return this.c_state_val_second;
    }

    // バトルモードで、次の手番が AI かどうか
    is_next_player_AI(){
        if(this.next_stone_state() != this.m_player_color)return true;
        return false;
    }

    // 空きマス (i,j) に first を置いたときに、いくつ反転できるか
    // おけない場合は 0 になる
    // ただし、空いていない場合はエラー
    calc_future_first(i,j){
        this.check_error();
        if(this.is_none(i,j) == false)throw new Error("error : invalid use(must be none)");

        var cnt = 0;
        // (dy,dx) := 変化量
        [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]].map( (dr) => {
            var second_cnt = 0;
            var ny = i;
            var nx = j;
            // dr の方向を調べる
            while(true){
                ny += dr[0];
                nx += dr[1];
                if(this.isin(ny, nx) == false)break;
                if(this.is_none(ny, nx))break;
                if(this.is_first(ny, nx)){
                    cnt += second_cnt;
                    break;
                }
                if(this.is_second(ny, nx))second_cnt++;
            }
        });
        return cnt;
    }

    // 空きマス (i,j) に second を置いたときに、いくつ反転できるか
    // おけない場合は 0 になる
    // ただし、空いていない場合はエラー
    calc_future_second(i,j){
        this.check_error();
        if(this.is_none(i,j) == false)throw new Error("error : invalid use(must be none)");    

        var cnt = 0;
        // (dy,dx) := 変化量
        [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]].map( (dr) => {
            var first_cnt = 0;
            var ny = i;
            var nx = j;
            // dr の方向を調べる
            while(true){
                ny += dr[0];
                nx += dr[1];
                if(this.isin(ny, nx) == false)break;
                if(this.is_none(ny, nx))break;
                if(this.is_second(ny, nx)){
                    cnt += first_cnt;
                    break;
                }
                if(this.is_first(ny, nx))first_cnt++;
                
            }
        });
        return cnt;
    }


    // (i,j) に次の手番が石を置き、ステータスも更新する。
    // 返り値は反転した石の個数 (0 なら、無効な手であるとわかる)
    // 状態更新処理パスの最も下のレイヤである
    put_stone(i,j){
        var cnt = 0;
        [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]].map( (dr) => {
            const stone_stack = [];
            var ny = i;
            var nx = j;
            // dr の方向を調べる
            while(true){
                ny += dr[0];
                nx += dr[1];
                if(this.isin(ny, nx) == false)break;
                if(this.is_none(ny, nx))break;

                // 次に置くのが先手の場合
                if(this.next_stone_state() == this.c_state_val_first){
                    if(this.is_first(ny, nx)){
                        for(var k = 0 ; k < stone_stack.length; k++){
                            this.flip(stone_stack[k][0],stone_stack[k][1]);
                            cnt++;
                        }
                        break;
                    }
                    if(this.is_second(ny, nx))stone_stack.push([ny, nx]);
                }else{// 後手の場合
                    if(this.is_second(ny, nx)){
                        for(var k = 0 ; k < stone_stack.length; k++){
                            this.flip(stone_stack[k][0],stone_stack[k][1]);
                            cnt++;
                        }
                        break;
                    }
                    if(this.is_first(ny, nx))stone_stack.push([ny, nx]);
                }    
            }
        });
        // 反転できたなら、(i,j) に石を置く。
        if(cnt > 0){
            const stone_state = this.next_stone_state();
            if(this.next_stone_state() == this.c_state_val_first){
                this.raw_set_first(i,j);
            }else{
                this.raw_set_second(i,j);
            }
            this.m_gametime++;
            this.m_last_placed_stone = stone_state;
            this.refresh_state();
        }
        return cnt;
    }

    set_battle_mode(){
        if(this.m_mutex)return;
        this.m_mutex = true;// 全ての終了スコープでロックを解除する必要がある

        if(this.m_userOp_lock > 0){
            this.m_mutex = false;
            return;
        }

        this.m_game_mode = this.c_battle_mode_val;

        let user_first = false;
        if(Math.random()*2 < 1)user_first = true;
        
        this.renew_state(false, user_first);
        this.m_mutex = false;
    }

    set_free_mode(){
        if(this.m_mutex)return;
        this.m_mutex = true;// 全ての終了スコープでロックを解除する必要がある

        if(this.m_userOp_lock > 0){
            this.m_mutex = false;
            return;
        }
        
        this.m_game_mode = this.c_free_mode_val;
        this.renew_state(false,false);
        this.m_mutex = false;
    }

    change_mode(confirm_){
        if(confirm_){
            var result;
            if(this.is_battle_mode()){
                result = confirm("現在のゲーム状態はリセットされます。フリープレイモードに切り替えますか？");
            }
            if(this.is_free_mode()){
                result = confirm("現在のゲーム状態はリセットされます。AI 対戦モードに切り替えますか？");
            }
            if (!result) return;
        }

        if(this.is_battle_mode()){
            this.set_free_mode();
        } else {
            this.set_battle_mode();
        }
    }

    // 現在フリーモードかどうか
    is_free_mode(){
        if(this.m_game_mode == this.c_free_mode_val)return true;
        return false;
    }

    // 現在バトルモードかどうか
    is_battle_mode(){
        if(this.m_game_mode == this.c_battle_mode_val)return true;
        return false;
    }

    // バトルモードへの切り替え
    change_to_battle_mode(confirm_){
        if(this.m_userOp_lock > 0)return;
        if(confirm_){
            const result = confirm("ゲームモードを切り替えますか？(状態はリセットされます)");
            if (!result) return;
        }
        this.m_game_mode = this.c_battle_mode_val;
        let user_first = false;
        if(Math.random()*2 < 1)user_first = true;
        this.renew_state(false,user_first);
    }

    // フリーモードへの切り替え
    change_to_free_mode(confirm_){
        if(this.m_userOp_lock > 0)return;
        if(confirm_){
            const result = confirm("ゲームモードを切り替えますか？(状態はリセットされます)");
            if (!result) return;
        }
        this.m_game_mode = this.c_free_mode_val;
        this.renew_state(false,false);
    }

    // 先手を表すシンボル
    first_SYMBOL(){
        return this.c_state_val_first;
    }
    // 後手を表すシンボル
    second_SYMBOL(){
        return this.c_state_val_second;
    }

    // すでに終了したか
    is_end(){
        return this.m_is_end;
    }

    // 石の状態 
    stone_state(i,j){
        return this.m_stones[i][j].getAttribute("name");
    }
    
    /*
        8x8 の配列として返す。
        - 0 : 空
        - 1 : 今の Board の状態で、次にうつ手の石
        - (-1) : 1 でない方の石
    */
    raw_data(){
        const res = Array.from({length : 8}, ()=>Array(8).fill(0));
        for(var i = 0 ; i < 8 ; i++){
            for(var j = 0 ; j < 8 ; j++){
                if(this.is_none(i,j))continue;
                if(this.next_stone_state() == this.stone_state(i,j)){
                    res[i][j] = 1;
                }else{
                    res[i][j] = -1;
                }
            }
        }
        return res;
    }
}();



/* =================================================================================
    オセロシミュレーション
    - 盤面情報と、手の情報を渡す。
    - 盤面情報は 8x8 の整数行列で、0 が空マス
================================================================================= */

const Simulator = new class{
    constructor(){}


    // (i,j) が盤面内かどうかを boolean で返す
    isin(i,j){
        if(i < 0)return false;
        if(i >= 8)return false;
        if(j < 0)return false;
        if(j >= 8)return false;
        return true;
    }

    // data が表現する状態で、(i,j) に stone (1 or -1) を置いた結果、取ることができる石の個数
    putable(data,i,j,stone){
        var res = false;
        if(data[i][j] != 0)return false;
        [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]].map( (dr) => {
            if(res)return;
            var diff_cnt = 0;// 違う石の個数
            var ny = i;
            var nx = j;
            // dr の方向を調べる
            while(true){
                ny += dr[0];
                nx += dr[1];
                if(this.isin(ny, nx) == false)break;
                if(data[ny][nx] == 0)break;
                if(data[ny][nx] == stone){
                    if(diff_cnt > 0)res = true;
                    break;
                }
                if(data[ny][nx] != stone)diff_cnt++;
            }
        });
        return res;
    }

    // data が表現する状態で、(i,j) に stone (1 or -1) を置いた結果、取ることができる石の個数
    // 無効な手は、0 を返す (必要十分条件)
    // ただし、空ではない場所に置くのはエラー
    calc_count(data, i, j, stone){
        if(data[i][j] != 0)throw new Error("error : invalid use(must be none)");
        var cnt = 0;
        // (dy,dx) := 変化量
        [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]].map( (dr) => {
            var diff_cnt = 0;// 違う石の個数
            var ny = i;
            var nx = j;
            // dr の方向を調べる
            while(true){
                ny += dr[0];
                nx += dr[1];
                if(this.isin(ny, nx) == false)break;
                if(data[ny][nx] == 0)break;
                if(data[ny][nx] == stone){
                    cnt += diff_cnt;
                    break;
                }
                if(data[ny][nx] != stone)diff_cnt++;
                
            }
        });
        
        return cnt;
    }


    // data が表現する状態で、(i,j) に stone (1 or -1) を置いた結果の配列
    // 無効な手はエラーとする
    calc_future(data, i, j, stone){
        if(this.putable(data, i, j, stone) == false)throw new Error("error : invalid use");
        if(this.isin(i,j) == false)throw new Error("error : invalid use");

        let res = Array.from({length : 8}, ()=>Array(8).fill(0));
        for(var y = 0 ; y < 8 ; y++){
            for(var x = 0 ; x < 8 ; x++){
                res[y][x] = data[y][x];
            }
        }

        [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]].map( (dr) => {
            const stone_stack = [];
            var ny = i;
            var nx = j;
            // dr の方向を調べる
            while(true){
                ny += dr[0];
                nx += dr[1];
                if(this.isin(ny, nx) == false)break;
                if(data[ny][nx] == 0)break;
                
                if(data[ny][nx] == stone){
                    for(var k = 0 ; k < stone_stack.length; k++){
                        const y = stone_stack[k][0];
                        const x = stone_stack[k][1];
                        if(res[y][x] == 1)res[y][x] = -1;
                        else res[y][x] = 1;
                    }
                    break;
                }
                if(data[ny][nx] != stone)stone_stack.push([ny, nx]);
            }
        });


        res[i][j] = stone;

        return res;
    }


}();





/* =================================================================================
    戦略クラス。石の置き方の戦略を定義する。
================================================================================= */

/* 基底クラス (accrpt を宣言) */
/*おける場所は、必ず正の評価値を返す*/
class IStrategy{
    constructor(wt){
        this.m_strategy_weight = wt;// 戦略の重み (評価値にかける)

        const corner = 300;
        const c_point = -30;// cうちの場所
        const edge_center = -7;// エッジの中央
        const edge_center_out = 14;// エッジの中央外

        // 一つ内側
        const corner_inner = -42;// 角
        const inner_edge_center = -10;// エッジの中央
        const inner_edge_center_out = 7;// エッジの中央外

        
        // 2 つ内側
        const center_corner = 7;
        const center_edge = -4;

        // 中央
        const center = 2;

        // 盤面の各マスの重み 
        // 正の重みは自身の石がそこにある場合に良い点数になる
        // 逆に、相手の石が置かれている部分はマイナスで評価する
        this.m_stone_weight = 
        [
            [corner , c_point  , edge_center_out   , edge_center  , edge_center  , edge_center_out   , c_point , corner ],
            [c_point , corner_inner  , inner_edge_center_out , inner_edge_center  , inner_edge_center  , inner_edge_center_out , corner_inner , c_point ],
            [edge_center_out   , inner_edge_center_out  , center_corner , center_edge  , center_edge  , center_corner , inner_edge_center_out , edge_center_out   ],
            [edge_center  , inner_edge_center   , center_edge  , center  , center  , center_edge  , inner_edge_center  , edge_center  ],
            [edge_center  , inner_edge_center  , center_edge  , center  , center  , center_edge  , inner_edge_center  , edge_center  ],
            [edge_center_out   , inner_edge_center_out  ,  center_corner , center_edge  , center_edge  , center_corner , inner_edge_center_out , edge_center_out],
            [c_point  , corner_inner  , inner_edge_center_out , inner_edge_center , inner_edge_center  , inner_edge_center_out , corner_inner , c_point ],
            [corner , c_point  , edge_center_out   , edge_center  , edge_center  , edge_center_out   , c_point  , corner ]
        ]


        // [[[自分が作った場合の]]] 悪いエッジの形 (2 はワイルドカード)
        // 同じものを複数入れておくと、その分だけ評価に影響する
        this.m_bad_edge_state = 
        [
            [[0,0,1,1,1,1,1,0],[0,0,1,-1,-1,1,0,0]],// ウィング
            [[0,1,1,1,1,1,0,0],[0,0,1,-1,-1,1,0,0]],// ウィング
            [[0,1,1,1,1,1,0,0],[0,0,1,1,1,1,0,0]],// ウィング
            [[0,0,1,1,1,1,1,0],[0,0,1,1,1,1,0,0]],// ウィング
            [[0,1,1,1,1,1,1,0],[0,0,1,1,1,1,0,0]],// 山
            [[0,1,1,1,1,0,0,0],[0,0,1,1,0,0,0,0]],// 山
            [[0,0,0,1,1,1,1,0],[0,0,0,0,1,1,0,0]],// 山
            [[0,0,1,1,1,1,0,0],[0,0,1,1,1,1,0,0]],// ブロック
            [[0,1,1,1,0,0,0,0],[0,0,2,2,2,2,0,0]],// C から 3 連続
            [[0,0,0,0,1,1,1,0],[0,0,2,2,2,2,0,0]],// C から 3 連続
            [[0,1,0,-1,-1,-1,0,0],[0,0,2,2,2,2,0,0]],// C うち、他方相手石
            [[0,0,-1,-1,-1,0,1,0],[0,0,2,2,2,2,0,0]],// C うち、他方相手石
            [[0,1,1,1,0,-1,0,0],[0,0,2,2,2,2,0,0]],// C うち、他方相手石
            [[0,0,-1,0,1,1,1,0],[0,0,2,2,2,2,0,0]],// C うち、他方相手石
            [[0,1,1,1,1,0,0,0],[0,0,2,2,2,2,0,0]],// C から 4 連続
            [[0,0,0,1,1,1,1,0],[0,0,2,2,2,2,0,0]],// C から 4 連続
            // 悪手
            [[0,1,1,1,0,1,0,0],[0,0,2,2,2,2,0,0]],[[0,1,1,1,0,1,0,0],[0,0,2,2,2,2,0,0]],[[0,1,1,1,0,1,0,0],[0,0,2,2,2,2,0,0]],
            // 悪手
            [[0,1,0,1,1,1,0,0],[0,0,2,2,2,2,0,0]],[[0,1,0,1,1,1,0,0],[0,0,2,2,2,2,0,0]],[[0,1,0,1,1,1,0,0],[0,0,2,2,2,2,0,0]]
        ];

        // [[[自分が作った場合の]]] 良いエッジの形
        this.m_great_edge_state = 
        [
            [[0,1,1,1,1,1,1,0],[0,0,1,-1,-1,1,0,0]],// 山
            [[0,1,1,1,1,1,1,0],[0,0,1,-1,1,-1,0,0]],// 山
            [[0,1,1,1,1,1,1,0],[0,0,-1,1,-1,1,0,0]]// 山       
        ];
    }

    // board_data が表現する盤面 (1 の石視点) の基本スコア
    calc_basic_score(board_data){
        let cnt = 0;// 置かれている石の個数
        let cnt1 = 0;// 置かれている石1の個数
        
        for(var y = 0 ; y < 8 ; y++){
            for(var x = 0 ; x < 8 ; x++){
                if(board_data[y][x] == 0)continue;
                cnt++;
                if(board_data[y][x] == 1)cnt1++;
            }
        }

        let res = 0;
        for(var y = 0 ; y < 8 ; y++){
            for(var x = 0 ; x < 8 ; x++){
                let weight = this.m_stone_weight[y][x];
                // 中央の部分は、終盤には + 得点にする
                if( 2 <= y && y <= 5 && 2 <= x && x <= 5){
                    if(cnt >= 57){
                        if(weight < 0)weight*=-1;
                    }
                }
                // 最終盤は、すべて正にする
                if(cnt >= 60){
                    if(weight < 0)weight*=-1;
                }
                res += board_data[y][x] * weight;
            }
        }

        if(cnt1 == 0)return -1*positive_inf;

        // ターン数によって、cnt1 の多さがスコアに影響するようにする
        if(cnt < 30){
            // 自身が多すぎるとマイナス
            if(cnt1 > (cnt-cnt1))res *= 0.84;
        }
        if(cnt >= 54){
            // 多い方が良い
            if(cnt1 > (cnt-cnt1))res *= 1.11;
        }

        if(cnt == 62 && cnt1 < (cnt-cnt1))res *= 0.8;
        if(cnt == 63 && cnt1 < (cnt-cnt1))res *= 0.7;
        if(cnt == 64 && cnt1 < (cnt-cnt1))res = -10000;


        

        // 少し乱数でブレを作る
        return Math.floor(res * (Math.random()*(1.3 - 0.8) + 0.8));
    }




    // [[[自分が作った場合の]]] 外周の状態評価 (1 の石視点)
    // -1(悪い) , 0(普通) , 1(良い) を、4 辺に対して合計して返す。
    calc_edge_score(board_data){

        // 2x8 行列のエッジ表現が一致することの定義
        function edge_same_judge(e1,e2){
            var res = true;
            // 外側
            for(var x = 0 ; x < 8 ; x++){
                if(e1[0][x] == 2 || e2[0][x] == 2)continue;
                if(e1[0][x] == e2[0][x])continue;
                res = false;
            }
            // 内側
            for(var x = 0 ; x < 8 ; x++){
                if(e1[1][x] == 2 || e2[1][x] == 2)continue;
                if(e1[1][x] == e2[1][x])continue;
                res = false;
            }
            return res;
        }
        

        // 評価値
        function eval_edge(e,badstate,greatstate){
            var res = 0;
            for(var i = 0 ; i < badstate.length ; i++){
                if(edge_same_judge(e,badstate[i]))res-=1;
            }
            for(var i = 0 ; i < greatstate.length ; i++){
                if(edge_same_judge(e,greatstate[i]))res+=1;
            }
            return res;
        }

        var sum = 0;
        // [0]:=外周 , [1]:=1つ内側
        var edge_stone = [[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0]];


        // 上の辺
        for(var x = 0 ; x < 8 ; x++)edge_stone[0][x] = board_data[0][x];
        for(var x = 1 ; x < 7 ; x++)edge_stone[1][x] = board_data[1][x];
        edge_stone[1][0] = 0;// 評価に関係ない部分
        edge_stone[1][7] = 0;
        sum += eval_edge(edge_stone,this.m_bad_edge_state,this.m_great_edge_state);

        // 下の辺
        for(var x = 0 ; x < 8 ; x++)edge_stone[0][x] = board_data[7][x];
        for(var x = 1 ; x < 7 ; x++)edge_stone[1][x] = board_data[6][x];
        edge_stone[1][0] = 0;// 評価に関係ない部分
        edge_stone[1][7] = 0;
        sum += eval_edge(edge_stone,this.m_bad_edge_state,this.m_great_edge_state);
        

        // 左の辺
        for(var x = 0 ; x < 8 ; x++)edge_stone[0][x] = board_data[x][0];
        for(var x = 1 ; x < 7 ; x++)edge_stone[1][x] = board_data[x][1];
        edge_stone[1][0] = 0;// 評価に関係ない部分
        edge_stone[1][7] = 0;
        sum += eval_edge(edge_stone,this.m_bad_edge_state,this.m_great_edge_state);

        // 右の辺
        for(var x = 0 ; x < 8 ; x++)edge_stone[0][x] = board_data[x][7];
        for(var x = 1 ; x < 7 ; x++)edge_stone[1][x] = board_data[x][6];
        edge_stone[1][0] = 0;// 評価に関係ない部分
        edge_stone[1][7] = 0;
        sum += eval_edge(edge_stone,this.m_bad_edge_state,this.m_great_edge_state);
        
        if(sum != 0)console.log(sum);
        return sum;
    }



    // 次の手番が i,j に置く場合の評価
    eval(board_manager,i,j){
        throw new Error("Cannot Use Abstract Class.");
    }
}



/* 取れる石の個数がそのまま評価値 */
class EasyStrategy extends IStrategy{
    // wt:= 戦略の重み(評価値にかける)
    constructor(wt){
        super(wt);
    }

    // 次の手番が i,j に置く場合の評価
    eval(board_manager,i,j){
        const borad_data = board_manager.raw_data();
        const calc_val = Simulator.calc_count(borad_data,i,j,1);
        if(calc_val == 0)throw new Error("INVALID"); 
        return calc_val * this.m_strategy_weight;
    }
}





/* 角の周囲に関する戦略。角以外の重みは、取れる石の個数。 */
class CornerBasicStrategy extends IStrategy{
    // wt:= 戦略の重み(評価値にかける)
    constructor(wt){
        super(wt);
    }

    // (i,j) が角周辺の場合に、評価値にかかる重みを定義する
    corner_weight(i,j){
        let sc_weight = 1;
        if(i == 0 && (j == 1 || j == 6))sc_weight = 0.5;
        if(i == 7 && (j == 1 || j == 6))sc_weight = 0.5;
        if(j == 0 && (i == 1 || i == 6))sc_weight = 0.5;
        if(j == 7 && (i == 1 || i == 6))sc_weight = 0.5;

        // 絶対ダメな場所
        if((i == 1 || i == 6) && (j == 1 || j == 6))sc_weight = 0;

        // 狙うべき場所
        if((i == 0 || i == 7) && (j == 0 || j == 7))sc_weight = 13;
        return sc_weight;
    }

    // 次の手番が i,j に置く場合の評価
    eval(board_manager,i,j){
        const borad_data = board_manager.raw_data();
        const calc_val = Simulator.calc_count(borad_data,i,j,1);
        if(calc_val == 0)throw new Error("INVALID"); 
        return calc_val * this.m_strategy_weight* this.corner_weight(i,j);
    }
}


/* エッジに関する評価をもつ */
class EdgeStrategy extends IStrategy{
    // wt:= 戦略の重み(評価値にかける)
    constructor(wt){
        super(wt);
    }

    // 次の手番が i,j に置く場合の評価
    eval(board_manager,i,j){
        // 置いた結果
        const future = Simulator.calc_future(board_manager.raw_data(),i,j,1);
        return this.calc_edge_score(future) * this.m_strategy_weight;
    }
}






/* それなりに強いモデル */
class StrongStrategy extends IStrategy{
    // wt:= 戦略の重み(評価値にかける)
    constructor(wt){
        super(wt);
    }


    // d 回、minmax を行う
    // minmax は、min の max を求めるので、呼び出し元の階層で既にわかっている値を用いて枝刈りする
    minmax_rec(board_data,i,j,d, edagari){
        if(Simulator.putable(board_data,i,j,1) == false)throw new Error("Cannot Use Abstract Class."); 
        if(d <= 0)throw new Error("Cannot Use Abstract Class."); 

        const future = Simulator.calc_future(board_data,i,j,1);
        
        // 相手がどこにも石をおけない場所のスコア
        let res = positive_inf;
        
        // その次の手番は (y,x) におく
        // 相手の行動を踏まえて、自分にとって最悪の場合のスコアを返す
        for(var y = 0 ; y < 8 ; y++){
            for(var x = 0 ; x < 8 ; x++){
                if(future[y][x] != 0)continue;

                // 相手がおけない場合 (自分にとっては良いこと)
                if(Simulator.putable(future,y,x,-1) == false)continue;
                
                // 相手の行動
                const future2 = Simulator.calc_future(future,y,x,-1);
                // さらに次の min の max を求める
                let layer1_scoremax = -1*positive_inf;
                
                // 末端
                if(d == 1){
                    layer1_scoremax = this.calc_basic_score(future2);
                    if(res > layer1_scoremax)res = layer1_scoremax;
                    
                    continue;
                }                

                // さらに次の自分の行動結果から minmax する
                for(var ny = 0 ; ny < 8 ; ny++){
                    for(var nx = 0 ; nx < 8 ; nx++){
                        if(future2[ny][nx] != 0)continue;
                        if(Simulator.putable(future2,ny,nx,1) == false)continue;
                        
                        let sc = this.minmax_rec(future2,ny,nx,d-1, layer1_scoremax);
                        
                        if(sc > layer1_scoremax)layer1_scoremax = sc;
                    }
                }
                if(layer1_scoremax == -1*positive_inf)continue;
                if(res > layer1_scoremax)res = layer1_scoremax;

                // 上の階層では、max を計算するので、max を更新する見込みがなければ枝刈り
                if(res <= edagari)break;
            }
        }
        
        return res;
    }

    
    // 2 階層の Min-Max
    // 次の手番が i,j に置く場合の評価
    eval(board_manager,i,j){
        // Min-Max
        const board_data = board_manager.raw_data();
        return this.minmax_rec(board_data,i,j,2);
    }
}



/* =================================================================================
    AI モデル
    - AI モデルの性能は、戦略デッキと評価関数(TODO)で定義されるものとする
================================================================================= */
class IModelAI {
    constructor(){
        this.m_strategy_deck = new Array(0);
        this.m_Op_lock = false;
    }

    // 多重実行防御
    lock(){
        this.m_Op_lock = true;
    }
    unlock(){
        this.m_Op_lock = false;
    }

    is_locked(){
        return this.m_Op_lock;
    }

    // 石を置く。はじめに lock,全ての終了パスで unlock を行う。
    // board_manager オブジェクトを対象に行動する
    // 一手読みなので、もっと探索したい場合はオーバーライドする
    basic_action(board_manager){
        if(this.is_locked())return;// 同時に通過してしまう可能性もあるのが怖い
        this.lock();

        // 手番の衝突
        if(board_manager.is_next_player_AI() == false){
            this.unlock();
            console.log(board_manager.next_stone_state())
            throw new Error("プロセスの衝突のためエスケープしました");
        }

        // パス
        if(board_manager.placeable() == false){
            board_manager.pass_turn(true);
            board_manager.refresh_state();
            board_manager.set_message("AI はパスしたの〜");
            this.unlock();
            return;
        }

        // ユーザ操作をブロック
        board_manager.block_userOp(400);


        // 場所候補
        const cands = [];
        const scores = [];// cands の同位置の要素の優先度。cands 要素と index が対応

        for(var i = 0 ; i < 8 ; i++){
            for(var j = 0 ; j < 8 ; j++){
                if(board_manager.placeable_at(i,j) == false)continue;
                cands.push([i,j]);
                scores.push(0);
            }
        }
        
        

        // 石をおけない場所のスコア (スコアの下界)
        const min_eval_score = -1*positive_inf;

        

        // 候補について処理を行う
        // val がマス目(i,j), idx は scores と連動させるための index
        cands.map((val, idx)=>{
            const [i,j] = val;
            
            // 自身が持つすべての戦略クラスからの評価の和をとる
            this.m_strategy_deck.map((st)=>{
                scores[idx] += st.eval(board_manager,i,j,-1*positive_inf);
            });
        });

        

        // 最大スコアと、その位置
        var mx_score = min_eval_score;
        var target = [-1,-1];
        
        
        cands.map((val, idx)=>{
            if(mx_score < scores[idx]){
                mx_score = scores[idx];
                target = val;
            }
        });

        console.log(mx_score);
        const [y,x] = target;
        if(mx_score == min_eval_score){
            board_manager.pass_turn(true);
            this.unlock();
            return;
        }
        
        if(board_manager.placeable_at(y,x) == false){
            this.unlock();
            throw new Error("INNER ERROR");
        }
        if(board_manager.is_none(y,x) == false){
            this.unlock();
            throw new Error("INNER ERROR");
        }
        board_manager.put_stone(y,x);
        this.unlock();

    }

    
    act(board_manager){
        this.basic_action(board_manager);
    }
}


// 最弱 AI
const WorstAI = new class extends IModelAI{
    constructor(){
        super();
        this.m_strategy_deck.push(new EasyStrategy(1));
    }
}();

// 角に強い AI
const CornerAI = new class extends IModelAI{
    constructor(){
        super();
        this.m_strategy_deck.push(new CornerBasicStrategy(1));
    }
}();


// 割と強い AI
const StrongAI = new class extends IModelAI{
    constructor(){
        super();
        this.m_strategy_deck.push(new StrongStrategy(1));
        this.m_strategy_deck.push(new EdgeStrategy(55));
    }
}();




/* =================================================================================
    ゲーム進行管理
================================================================================= */
const GameManager = new class {
    constructor(){
        
        // 盤面の内部的なデータではなく
        // ゲーム進行において、その時に操作可能なプレイヤーの判別
        this.m_is_AIturn = false;

        // どのプレイヤーにもキャッチされなかったリクエスト呼び出し回数
        // 一定回数を超えると、board の不整合として、ボードの状態を更新する
        // バグが出たら活用する
        this.m_uncatched_request_count = 0;

        // ボードマネージャーと AI オブジェクトへの参照
        this.m_board_manager = null;
        this.m_othello_ai = null;

        // AI の選択のためのドロップダウンリスト
        this.c_AISelectorID = "AI_Selector";
        // 要素名
        this.c_selectItem_CornerAI = "初級";
        this.c_selectItem_StrongAI = "真剣勝負級";
    }

    // ゲーム管理開始
    initialize(board_manager){
        this.m_is_AI_processing = false;
        this.m_board_manager = board_manager;

        // 盤面を初期化
        let user_first = false;
        if(Math.random()*2 < 1)user_first = true;
        this.m_board_manager.renew_state(false,user_first);


        const selector = document.getElementById(this.c_AISelectorID);

        this.m_othello_ai = CornerAI;// 一番上の選択肢に対応
        selector.add(new Option(this.c_selectItem_CornerAI,this.c_selectItem_CornerAI));
        selector.add(new Option(this.c_selectItem_StrongAI,this.c_selectItem_StrongAI));

        // AI 変更時の処理をここで定義
        selector.addEventListener('change', () => {
            const selectedAI = selector.value;
            const result = confirm("AI レベルを変更するとゲームはリセットされます。本当に変更しますか？");
            if (!result) return;

            let user_first = false;
            if(Math.random()*2 < 1)user_first = true;

            if(selectedAI == this.c_selectItem_CornerAI){
                this.m_othello_ai = CornerAI;
            }
            if(selectedAI == this.c_selectItem_StrongAI){
                this.m_othello_ai = StrongAI;
            }
            
            this.m_board_manager.renew_state(false,user_first);
        });
    }


    // 定期的に行われる処理
    // AI の行動リクエストなど
    process(){
        if(this.m_board_manager.is_free_mode())return;
        if(this.m_is_AI_processing == false && this.m_board_manager.is_next_player_AI()){
            if(this.m_board_manager.is_end()){
                this.m_board_manager.refresh_state();
                return;
            }
            // 快適プレイのため、検知から少し待って AI にプレイさせる
            if(this.m_othello_ai.is_locked() == false && this.m_is_AI_processing == false){
                this.m_is_AI_processing = true;
                this.m_board_manager.refresh_state();// 状態の更新もついでに
                setTimeout(() => {
                    // ロックされていなければ、AI のアクションを命令する。
                    if(this.m_othello_ai.is_locked() == false){
                        this.m_othello_ai.act(this.m_board_manager);
                    }
                    this.m_is_AI_processing = false;
                }, 400);// 待機時間
            }   
        }

        
    }

}();


/* =================================================================================
    メインプロシージャ
================================================================================= */

// ゲーム進行管理オブジェクト初期化
GameManager.initialize(BoardManager);

// 定期的にさまざまな要素をチェックし、イベントを発火させる。
setInterval(()=>{
    
    GameManager.process();
}, 100);