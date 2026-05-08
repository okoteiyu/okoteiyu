
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
        this.c_state_val_none  = "var(--stone-state-none)";
        this.c_state_val_white = "var(--stone-state-white)";
        this.c_state_val_black = "var(--stone-state-black)";

        // ボード関連の html 要素の参照
        this.m_board_element = document.getElementById("othellogame_boardID");
        this.m_resetbutton_element = document.getElementById("othellogame_resetbuttonID");
        this.m_resetbutton_element.addEventListener("click", ()=>this.renew_state(true));

        this.m_messageBox_element = document.getElementById("othellogame_messageBoxID");

        this.m_passbutton_element = document.getElementById("othellogame_passbuttonID");
        this.m_passbutton_element.addEventListener("click", ()=>this.pass_turn(true));

        this.m_counter_element = document.getElementById("othellogame_counterID");
        this.m_nextInfo_element = document.getElementById("othellogame_nextInfoID");
        this.m_static_state_element = document.getElementById("othellogame_static_stateID");

        // 石の二次元配列 ({length:8} の配列にマッピングで初期化)
        this.m_stones = Array.from({length : 8}, ()=>Array(8).fill(null));
        this.m_gametime = 0;// 経過ターン数 (次の手番のターンは gametime+1)
        this.m_passcount = 0;// パスの回数
        this.m_is_end = false;

        // 同期をとるため、ユーザからの操作をブロックするためのフラグ。
        this.m_userOp_lock = 0;// ブロッキングが呼ばれている回数
        this.m_mutex = false;// 特定の関数の実行を単位とするロック

        // ゲームモードと、プレイヤーがどちらの手番か。これによって、ユーザ操作の制限が変わる.
        this.c_free_mode_val = "FREE_MODE>";
        this.c_battle_mode_val = "BATTLE_MODE";
        this.m_game_mode = this.c_free_mode_val;
        // バトルモードにおけるプレイヤーの石の色
        this.m_player_color = this.c_state_val_black;

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
                console.log(this.get_place(this.m_stones[i][j]))
            }
        }
        this.renew_state(false);
        this.change_to_battle_mode(false);
    }




    // 盤面を最初の状態に戻す (引数は、確認を行うかどうか)
    // バトルモードの場合、手番もここで決める
    renew_state(confirm_){
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
        this.raw_set_white(3,3);
        this.raw_set_white(4,4);
        this.raw_set_black(4,3);
        this.raw_set_black(3,4);
        this.m_gametime = 0;
        this.m_passcount = 0;
        this.m_is_end = false;
        this.set_message("盤面の初期化が完了しました。");

        if(this.is_free_mode()){
            this.set_static_state("フリープレイモード");
        }
        if(this.is_battle_mode()){
            if(Math.random()*2 < 1){
                this.m_player_color = this.c_state_val_white;
                this.set_static_state("AI 対戦 (あなた:⚪️)");
            }else{
                this.m_player_color = this.c_state_val_black;
                this.set_static_state("AI 対戦 (あなた:⚫️)");
            }
        }
        this.refresh_state();
    }

    // 石をクリックしたときの反応。
    react(e){
        if(this.m_mutex)return;
        this.m_mutex = true;// 全ての終了スコープでロックを解除する必要がある
        if(this.m_userOp_lock > 0)return;
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
        if(this.next_turn()%2 == 1){// 次が黒の場合
            return this.placeable_black(i,j);
        }
        return this.placeable_white(i,j);
    }


    // (i,j) に white を置くことができるかどうか
    placeable_white(i,j){
        if(this.is_none(i,j) == false)return false;
        if(this.calc_future_white(i,j) == 0)return false;
        return true;
    }
    // (i,j) に black を置くことができるかどうか
    placeable_black(i,j){
        if(this.is_none(i,j) == false)return false;
        if(this.calc_future_black(i,j) == 0)return false;
        return true;
    }

    // ターンをパスする (引数は、確認を行うかどうか)
    pass_turn(confirm_){
        if(this.m_userOp_lock > 0)return;
        if(this.is_next_player_AI()){
            this.set_message("今は相手の番なの〜");
            return;
        }
        if(this.placeable()){
            this.set_message("まだ置ける場所があるの〜");
            return;
        }
        
        if(confirm_){
            const result = confirm("本当にパスしますか？");
            if (!result) return;
        }
        
        this.m_gametime++;
        this.m_passcount++;
        this.refresh_state();
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
        var black_count = 0;
        var white_count = 0;
        
        var put_able_count_white = 0;// 配置可能な場所の個数
        var put_able_count_black = 0;// 配置可能な場所の個数

        for(var i = 0 ; i < 8 ; i++){
            for(var j = 0 ; j < 8 ; j++){
                if(this.is_black(i,j))black_count++;
                else if(this.is_white(i,j))white_count++;
                else {
                    if(this.placeable_black(i,j))put_able_count_black++;
                    if(this.placeable_white(i,j))put_able_count_white++;
                }
            }
        }

        this.m_counter_element.innerText = "⚫️:" + String(black_count) + " / ⚪️:" + String(white_count);
        if(this.next_stone_state() == this.c_state_val_black){
            this.m_nextInfo_element.innerText = "次 : ⚫️";
        }else{
            this.m_nextInfo_element.innerText = "次 : ⚪️";
        }

        // ゲーム終了
        if(put_able_count_white + put_able_count_black == 0){
            var end_message = "終了〜!!! ";
            if(black_count > white_count)end_message += "黒の勝ち🌟";
            if(black_count < white_count)end_message += "白の勝ち🌟";
            if(black_count == white_count)end_message += "引き分け🌟";
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
        if(this.m_stones[i][j].style.backgroundColor == this.c_state_val_none)return true;
        return false;
    }
    // (i,j) の石が white かどうか
    is_white(i,j){
        this.check_error(i,j); // 有効性チェック
        if(this.m_stones[i][j].style.backgroundColor == this.c_state_val_white)return true;
        return false;
    }
    // (i,j) の石が black かどうか
    is_black(i,j){
        this.check_error(i,j); // 有効性チェック
        if(this.m_stones[i][j].style.backgroundColor == this.c_state_val_black)return true;
        return false;
    }

    // 盤面データを直接 none に変更する。すなわち、他の石の反転などは行われない。
    raw_set_none(i , j){
        this.check_error(i,j); // 有効性チェック
        this.m_stones[i][j].style.backgroundColor = this.c_state_val_none;
    }
    // 盤面データを直接 white に変更する。すなわち、他の石の反転などは行われない。
    raw_set_white(i , j){
        this.check_error(i,j); // 有効性チェック
        this.m_stones[i][j].style.backgroundColor = this.c_state_val_white;
    }
    // 盤面データを直接 black に変更する。すなわち、他の石の反転などは行われない。
    raw_set_black(i , j){
        this.check_error(i,j); // 有効性チェック
        this.m_stones[i][j].style.backgroundColor = this.c_state_val_black;
    }

    // (i,j) の石を反転する
    flip(i,j){
        this.check_error();
        if(this.is_none(i,j))throw new Error("error : invalid use(flipping null)");

        if(this.is_black(i,j)){
            this.m_stones[i][j].style.animation = "black_to_white 300ms linear";
            this.raw_set_white(i,j);// 念の為多重で変換
            return;
        }
        if(this.is_white(i,j)){
            this.m_stones[i][j].style.animation = "white_to_black 300ms linear";
            this.raw_set_black(i,j);// 念の為多重で変換
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
        if(this.next_turn()%2 == 1)return this.c_state_val_black;
        return this.c_state_val_white;
    }

    // バトルモードで、次の手番が AI かどうか
    is_next_player_AI(){
        if(this.next_stone_state() != this.m_player_color)return true;
        return false;
    }

    // 空きマス (i,j) に black を置いたときに、いくつ反転できるか
    calc_future_black(i,j){
        this.check_error();
        if(this.is_none(i,j) == false)throw new Error("error : invalid use(must be none)");

        var cnt = 0;
        // (dy,dx) := 変化量
        [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]].map( (dr) => {
            var white_cnt = 0;
            var ny = i;
            var nx = j;
            // dr の方向を調べる
            while(true){
                ny += dr[0];
                nx += dr[1];
                if(this.isin(ny, nx) == false)break;
                if(this.is_none(ny, nx))break;
                if(this.is_black(ny, nx)){
                    cnt += white_cnt;
                    break;
                }
                if(this.is_white(ny, nx))white_cnt++;
            }
        });
        return cnt;
    }

    // 空きマス (i,j) に white を置いたときに、いくつ反転できるか
    calc_future_white(i,j){
        this.check_error();
        if(this.is_none(i,j) == false)throw new Error("error : invalid use(must be none)");    

        var cnt = 0;
        // (dy,dx) := 変化量
        [[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]].map( (dr) => {
            var black_cnt = 0;
            var ny = i;
            var nx = j;
            // dr の方向を調べる
            while(true){
                ny += dr[0];
                nx += dr[1];
                if(this.isin(ny, nx) == false)break;
                if(this.is_none(ny, nx))break;
                if(this.is_white(ny, nx)){
                    cnt += black_cnt;
                    break;
                }
                if(this.is_black(ny, nx))black_cnt++;
                
            }
        });
        return cnt;
    }


    // (i,j) に次の手番が石を置き、ステータスも更新する。
    // 返り値は反転した石の個数 (0 なら、無効な手であるとわかる)
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

                // 次に置くのが黒の場合
                if(this.next_stone_state() == this.c_state_val_black){
                    if(this.is_black(ny, nx)){
                        for(var k = 0 ; k < stone_stack.length; k++){
                            this.flip(stone_stack[k][0],stone_stack[k][1]);
                            cnt++;
                        }
                        break;
                    }
                    if(this.is_white(ny, nx))stone_stack.push([ny, nx]);
                }else{// 白の場合
                    if(this.is_white(ny, nx)){
                        for(var k = 0 ; k < stone_stack.length; k++){
                            this.flip(stone_stack[k][0],stone_stack[k][1]);
                            cnt++;
                        }
                        break;
                    }
                    if(this.is_black(ny, nx))stone_stack.push([ny, nx]);
                }    
            }
        });
        // 反転できたなら、(i,j) に石を置く。
        if(cnt > 0){
            if(this.next_stone_state() == this.c_state_val_black){
                this.raw_set_black(i,j);
            }else{
                this.raw_set_white(i,j);
            }
            this.m_gametime++;
            this.refresh_state();
        }
        return cnt;
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
        this.renew_state(false);
    }

    // フリーモードへの切り替え
    change_to_free_mode(confirm_){
        if(this.m_userOp_lock > 0)return;
        if(confirm_){
            const result = confirm("ゲームモードを切り替えますか？(状態はリセットされます)");
            if (!result) return;
        }
        this.m_game_mode = this.c_free_mode_val;
        this.renew_state(false);
    }

    // 黒を表すシンボル
    BLACK_SYMBOL(){
        return this.c_state_val_black;
    }
    // 白を表すシンボル
    WHITE_SYMBOL(){
        return this.c_state_val_white;
    }

    // すでに終了したか
    is_end(){
        return this.m_is_end;
    }
}();


/* =================================================================================
    戦略(ストラテジ)クラス。石の置き方の戦略を定義する。
    あるマスに石を置く戦略の強さを 0~10 の実数で評価。
================================================================================= */

/* 基底クラス (accrpt を宣言) */
class IStrategy{
    constructor(){}

    
    /* (i,j) に white を置く操作が、この戦略のもとで受け入れられるかどうか。 */
    accept_white(i,j){
        throw new Error("Cannot Use Abstract Class.");
    }

    /* (i,j) に black を置く操作が、この戦略のもとで受け入れられるかどうか */
    accept_black(i,j){
        throw new Error("Cannot Use Abstract Class.");
    }
}

/* 完全ランダム */
class EasyStrategy extends IStrategy{
    constructor(){
        super();
    }
    accept_white(i,j){
        return true;
    }
    accept_black(i,j){
        return true;
    }
}



/* =================================================================================
    AI モデル
    - AI モデルの性能は、戦略デッキと評価関数(TODO)で定義されるものとする
================================================================================= */


const OkoteiyuOthelloAI = new class {
    constructor(){
        this.m_strategy_deck = [new EasyStrategy()];
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
    act(){
        if(this.is_locked())return;// 同時に通過してしまう可能性もあるのが怖い
        this.lock();
        if(BoardManager.is_next_player_AI() == false){
            this.unlock();
            throw new Error("プロセスの衝突のためエスケープしました");
        }

        // パス
        if(BoardManager.placeable() == false){
            BoardManager.pass_turn(false);
            BoardManager.refresh_state();
            BoardManager.set_message("AI はパスしたの〜");
            this.unlock();
            return;
        }

        // ユーザ操作をブロック
        BoardManager.block_userOp(400);

        // AI の石の色
        var is_black = false;
        if(BoardManager.next_turn()%2 == 1)is_black = true;

        const cands = [];// 場所候補
        const scores = [];// cands の同位置の要素の優先度
        for(var i = 0 ; i < 8 ; i++){
            for(var j = 0 ; j < 8 ; j++){
                if(BoardManager.placeable_at(i,j) == false)continue;
                cands.push([i,j]);
                scores.push(0);
            }
        }
        
        // 候補について処理を行う
        cands.map((val, idx)=>{
            const [i,j] = val;
            if(is_black){
                // 黒を置くスコアを、マスごとに計算
                this.m_strategy_deck.map((st)=>{
                    if(st.accept_black(i,j)){
                        scores[idx] += Math.random();
                    }
                });
            }else{
                // 白
                this.m_strategy_deck.map((st)=>{
                    if(st.accept_white(i,j)){
                        scores[idx] += Math.random();
                    }
                });
            }
        });

        var mx_score = -1;
        var target = [-1,-1];
        cands.map((val, idx)=>{
            if(mx_score < scores[idx]){
                mx_score = scores[idx];
                target = val;
            }
        });
        const [y,x] = target;
        console.log(y,x);
        if(BoardManager.placeable_at(y,x) == false)throw new Error("INNER ERROR");
        if(BoardManager.is_none(y,x) == false)throw new Error("INNER ERROR");
        BoardManager.put_stone(y,x);
        this.unlock();
    }

}();



/* =================================================================================
    メインプロシージャ
================================================================================= */

// 定期的にさまざまな要素をチェックし、イベントを発火させる。
setInterval(()=>{
    
    if(BoardManager.is_next_player_AI()){
        if(BoardManager.is_end()){
            BoardManager.refresh_state();
            return;
        }
        // 快適プレイのため、検知から少し待ってプレイさせる
        if(OkoteiyuOthelloAI.is_locked() == false){
            BoardManager.refresh_state();// 状態の更新もついでに
            setTimeout(() => {
                // ロックされていなければ、AI のアクションを命令する。
                if(OkoteiyuOthelloAI.is_locked() == false){
                    OkoteiyuOthelloAI.act();
                }
                
            }, 400);    
        }
        
    }
}, 100);