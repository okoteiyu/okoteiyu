/*===================================================================================================
    const なグローバル変数
===================================================================================================*/

// 表示対象 HTML 要素
const RootField = document.getElementById("SiteMapField");
const RootFieldWidth = RootField.getBoundingClientRect().width;
const RootFieldHeight = RootField.getBoundingClientRect().height;

// 全ての画像の元のサイズは固定 !!!!
const ImageWidth = 1920;
const ImageHeight = 1080;
const ImageWHRatio = ImageWidth/ImageHeight;

// ノードのプロパティ
const KEY_LEARNING_PRIORITY = "IMPORTANCE";
const KEY_DIFFICULTY = "DIFFICULTY";
const KEY_IMAGEPATH = "IMAGEPATH";
const KEY_ARTICLEPATH = "ARTICLEPATH";

// ノードの ID
const NODEID_SEGTREE = "SegTreeID";
const NODEID_DP_TYPICAL = "TYPIALI_DP_ID";
const NODEID_PREFIX_SUM = "PREFIX_SUM_ID";
const NODEID_FORMALPOWERSERIES = "FORMALPOWERSERIES_ID";
const NODEID_WAVELETMATRIX = "WAVELETMATRIX_ID";
const NODEID_GRAPH = "GRAPH_ID";
const NODEID_TREE = "TREE_ID";
const NODEID_DIJKSTRA = "DIJKSTRA_ID";
const NODEID_EULER_TOUR = "EULER_TOUR_ID";
const NODEID_ROLLING_HASH = "ROLLING_HASH_ID";
const NODEID_SUFFIXTREE = "SUFFIXTREE_ID";
const NODEID_KDTREE = "KDTREE_ID";

// 重要度(1~10), 難易度(1~10), 画像パス, 記事の相対パス
// パスは、呼び出す HTML からの相対パス
const node_property_json = {
    // セグ木を基準とする
    [NODEID_SEGTREE] : {// セグ木
        [KEY_LEARNING_PRIORITY] : 8,
        [KEY_DIFFICULTY] : 5,
        [KEY_IMAGEPATH] : "./../static/DummyImage/DummyImage.002.jpeg", 
        [KEY_ARTICLEPATH] : "./"
    },
    [NODEID_DP_TYPICAL] : {// DP
        [KEY_LEARNING_PRIORITY] : 8,
        [KEY_DIFFICULTY] : 5,
        [KEY_IMAGEPATH] : "./../static/DummyImage/DummyImage.003.jpeg", 
        [KEY_ARTICLEPATH] : "./"
    },
    [NODEID_PREFIX_SUM] : {// 累積和
        [KEY_LEARNING_PRIORITY] : 8,
        [KEY_DIFFICULTY] : 2,
        [KEY_IMAGEPATH] : "./../static/DummyImage/DummyImage.004.jpeg", 
        [KEY_ARTICLEPATH] : "./"
    },
    [NODEID_FORMALPOWERSERIES] : {// FPS
        [KEY_LEARNING_PRIORITY] : 4,
        [KEY_DIFFICULTY] : 8,
        [KEY_IMAGEPATH] : "./../static/DummyImage/DummyImage.005.jpeg", 
        [KEY_ARTICLEPATH] : "./"
    },
    [NODEID_WAVELETMATRIX] : {// Wavelet Matrix
        [KEY_LEARNING_PRIORITY] : 5,
        [KEY_DIFFICULTY] : 7,
        [KEY_IMAGEPATH] : "./../static/DummyImage/DummyImage.006.jpeg", 
        [KEY_ARTICLEPATH] : "./"
    },
    [NODEID_GRAPH] : {// graph
        [KEY_LEARNING_PRIORITY] : 6,
        [KEY_DIFFICULTY] : 4,
        [KEY_IMAGEPATH] : "./../static/DummyImage/DummyImage.007.jpeg", 
        [KEY_ARTICLEPATH] : "./"
    },
    [NODEID_TREE] : {// tree
        [KEY_LEARNING_PRIORITY] : 8,
        [KEY_DIFFICULTY] : 6,
        [KEY_IMAGEPATH] : "./../static/DummyImage/DummyImage.008.jpeg", 
        [KEY_ARTICLEPATH] : "./"
    },
    [NODEID_DIJKSTRA] : {// Dijkstra
        [KEY_LEARNING_PRIORITY] : 7,
        [KEY_DIFFICULTY] : 3,
        [KEY_IMAGEPATH] : "./../static/DummyImage/DummyImage.009.jpeg", 
        [KEY_ARTICLEPATH] : "./"
    },
    [NODEID_EULER_TOUR] : {// Dijkstra
        [KEY_LEARNING_PRIORITY] : 6,
        [KEY_DIFFICULTY] : 4,
        [KEY_IMAGEPATH] : "./../static/DummyImage/DummyImage.010.jpeg", 
        [KEY_ARTICLEPATH] : "./"
    },
    [NODEID_ROLLING_HASH] : {// RollingHash
        [KEY_LEARNING_PRIORITY] : 4,
        [KEY_DIFFICULTY] : 4,
        [KEY_IMAGEPATH] : "./../static/DummyImage/DummyImage.011.jpeg", 
        [KEY_ARTICLEPATH] : "./"
    },
    [NODEID_SUFFIXTREE] : {// Suffix Tree
        [KEY_LEARNING_PRIORITY] : 8,
        [KEY_DIFFICULTY] : 8,
        [KEY_IMAGEPATH] : "./../static/DummyImage/DummyImage.012.jpeg", 
        [KEY_ARTICLEPATH] : "./"
    },
    [NODEID_KDTREE] : {// KdTree
        [KEY_LEARNING_PRIORITY] : 4,
        [KEY_DIFFICULTY] : 7,
        [KEY_IMAGEPATH] : "./../static/DummyImage/DummyImage.013.jpeg", 
        [KEY_ARTICLEPATH] : "./"
    }
}


// コンテンツの関連があるペアの配列
const ContentRelationship = [
    [NODEID_SEGTREE, NODEID_WAVELETMATRIX],
    [NODEID_DP_TYPICAL, NODEID_PREFIX_SUM],
    [NODEID_FORMALPOWERSERIES, NODEID_PREFIX_SUM],
    [NODEID_DP_TYPICAL, NODEID_FORMALPOWERSERIES],
    [NODEID_DP_TYPICAL, NODEID_EULER_TOUR],
    [NODEID_DP_TYPICAL, NODEID_TREE],
    [NODEID_DP_TYPICAL, NODEID_DIJKSTRA],
    [NODEID_TREE, NODEID_DIJKSTRA],
    [NODEID_TREE, NODEID_SUFFIXTREE],
    [NODEID_ROLLING_HASH, NODEID_SUFFIXTREE]
];


// [x] := ID が x のコンテンツの関連するコンテンツ数
const RelationStrength = {};
// 初期化
for(let i = 0 ; i < ContentRelationship.length; i++){
    RelationStrength[ContentRelationship[i][0]] = 0;
    RelationStrength[ContentRelationship[i][1]] = 0;
}
// 計算
for(let i = 0 ; i < ContentRelationship.length; i++){
    RelationStrength[ContentRelationship[i][0]]++;
    RelationStrength[ContentRelationship[i][1]]++;
}


/*===================================================================================================
    サイトマップ構築データ(変数)
===================================================================================================*/


let NodeObjects = {};       // ノードID からの連想配列
let NodeObjectsArray = [];  // index でノードにアクセスする配列
const ContentCount = Object.keys(node_property_json).length;


// TODO : ここを、表示オブジェクトの個数に応じて上手く計算するようにする
const min_height = Math.min(RootFieldWidth,RootFieldHeight)/8 + 1;
const max_height = Math.min(RootFieldWidth,RootFieldHeight)/3 + 1;


/*===================================================================================================
    クラス定義
===================================================================================================*/

class Point2D{
    constructor(x,y){
        this.x_ = x;
        this.y_ = y;
    }
    set_x(x){
        this.x_ = x;
    }
    set_y(y){
        this.y_ = y;
    }
    x(){
        return this.x_;
    }
    y(){
        return this.y_;
    }
}


// HTML 要素の作成
function make_nodehtml(image_link){
    // 生成する HTML 要素
    const res = document.createElement("div");

    // 画像部分
    const image_field = document.createElement("img");
    image_field.src = image_link;
    image_field.style.position = "relative";
    image_field.style.height = "100%";// 親に合わせる
    image_field.style.marginBottom = "0px";// 親に合わせる

    res.appendChild(image_field);
    res.style.position = "absolute";
    res.style.overflow = "hidden";
    return res;
}



// 表示するコンテンツ
class NodeBlock{
    constructor(node_id){
        // 位置情報( HTML 要素の左上の座標)
        this.position = new Point2D(0,0);
        // ノードのプロパティ
        this.propety = node_property_json[node_id];
        // ノードの ID
        this.node_id = node_id;

        // HTML 要素の定義
        this.html_content = make_nodehtml(this.propety[KEY_IMAGEPATH]);
        this.html_content.style.borderRadius = 15 + "px";
        this.html_content.style.border = "solid 5px";
        this.html_content.style.borderColor = "gray";
        this.html_content.style.boxSizing = "border-box";
        this.html_content.style.backgroundColor = "#FFFFFF";
        this.html_content.style.display = "none";

        // 表示対象に挿入
        RootField.appendChild(this.html_content);

        // 位置やサイズに関する値の設定
        this.set_height(0);
        this.set_x(this.position.x);
        this.set_y(this.position.y);
    }

    // 位置の設定 (y)
    set_y(y){
        this.position.set_y(y);
        this.html_content.style.top = this.position.y() + "px";
    }
    // 位置の設定 (x)
    set_x(x){
        this.position.set_x(x);
        this.html_content.style.left = this.position.x() + "px";
    }
    // サイズの変更は height_ のみに注目する (width は勝手に変わる)
    set_height(h){
        this.height_ = h;
        this.html_content.style.height = this.height_ + "px";
    }
    // 位置の取得 (y)
    y(){
        return this.position.y();
    }
    // 位置の取得 (x)
    x(){
        return this.position.x();
    }
    // 高さの取得
    height(){
        return this.height_;
    }
    // 幅の取得 (height と、元画像の縦横比率から計算)
    width(){
        return this.height()*ImageWHRatio;
    }
    // 非表示にする
    deactivate(){
        this.html_content.style.display = "none";
    }
    // 表示にする
    activate(){
        this.html_content.style.display = "block";
    }
    // 面積
    area(){
        return this.height()*this.width();
    }
    // 中心座標
    center(){
        return new Point2D((this.x()*2 + this.width())/2, (this.y()*2 + this.height())/2);
    }
    // 現時点での位置やサイズのデータを返す
    memento(){
        return {
            "x" : this.x(),
            "y" : this.y(),
            "h" : this.height()
        };
    }
    // memento データを適用
    apply_memento(mem){
        this.set_x(mem["x"]);
        this.set_y(mem["y"]);
        this.set_height(mem["h"]);
    }
}


/*===================================================================================================
    一般的な機能(関数)の定義
===================================================================================================*/

// ユークリッド距離
function dist2Dpoints(A, B){
    return Math.sqrt(Math.pow(A.x() - B.x(),2) + Math.pow(A.y() - B.y(),2));
}

// マンハッタン距離
function Mdist2Dpoints(A, B){
    return Math.abs(A.x() - B.x()) + Math.abs(A.y() - B.y());
}

// 二つの区間 [ l1 , r1 ) と [ l2 , r2 ) が 交差するか
function intersect(l1,r1,l2,r2){
    return Boolean(l1 <= l2 && l2 < r1) || Boolean(l2 <= l1 && l1 < r2);
}

// 二つの NodeBlock が重複するか
function overlap(nb1, nb2){
    return intersect(nb1.x(), nb1.x()+nb1.width() ,nb2.x(), nb2.x()+nb2.width())
        && intersect(nb1.y(), nb1.y()+nb1.height() ,nb2.y(), nb2.y()+nb2.height());
}



/*===================================================================================================
    評価関数
===================================================================================================*/


// 一つ目のスコア (面積比に関するスコア)
function eval_score_d1(){
    const N = ContentCount;
    const M = 5000;

    let p = 0;

    for(const node_id_1 in NodeObjects){
        let node1 = NodeObjects[node_id_1];
        const value1 = node_property_json[node_id_1][KEY_LEARNING_PRIORITY] 
                        + Math.sqrt(node_property_json[node_id_1][KEY_DIFFICULTY]);
                        + RelationStrength[node_id_1];
        for(const node_id_2 in NodeObjects){
            if(node_id_1 == node_id_2)continue;
            let node2 = NodeObjects[node_id_2];
            const value2 = node_property_json[node_id_2][KEY_LEARNING_PRIORITY]
                            + Math.sqrt(node_property_json[node_id_2][KEY_DIFFICULTY])
                            + RelationStrength[node_id_2];
            if(value1 >= value2)continue;
            if(node1.area() < node2.area())continue;
            // value1 < importance かつ node1.area() >= node2.area() のペアをカウント    
            p++;
        }
    }
    return M*(1-(p*2)/(N*(N-1)));
}

// 関連性と距離に関するスコア
function eval_score_d2(){
    const N = ContentCount;
    const M = 5000;

    let T = 0;

    for(let i = 0 ; i < ContentRelationship.length ; i++){
        const edge = ContentRelationship[i];
        const node1 = NodeObjects[edge[0]];
        const node2 = NodeObjects[edge[1]];
        T = Math.max(T,dist2Dpoints(node1.center(), node2.center()));
    }
    return -M*((T/RootFieldHeight));
}



// 関連性と距離に関するスコア
function eval_score_d3(){
    const M = 1500;

    let S = 0;
    for(const node_id_1 in NodeObjects){
        let node1 = NodeObjects[node_id_1];
        S += node1.area();
    }
    return (M*S)/(RootFieldWidth*RootFieldHeight);
}



// 現時点のオブジェクト配置状態のスコア
function eval_score(){
    
    
    let P1 = eval_score_d1();
    let P2 = eval_score_d2();
    let P3 = eval_score_d3();


    return P1 + P2 + P3;
}


// 表示オブジェクト配置が有効かどうか
// target = -1 ならば、全ての表示オブジェクトを確認する。
// そうでないなら、target 番目のみ確認する。
function is_valid_state(target = -1){
    for(let i = 0 ; i < ContentCount ; i++){
        if(target != -1 && i != target)continue;
        let node1 = NodeObjectsArray[i];
        // 範囲確認
        if(node1.x() < 0 || node1.y() < 0)return false;
        if(RootFieldWidth < node1.x() + node1.width())return false;
        if(RootFieldHeight < node1.y() + node1.height())return false;

        // 重複確認
        for(let j = 0 ; j < ContentCount ; j++){
            if(i == j)continue;
            let node2 = NodeObjectsArray[j];
            if(overlap(node1,node2))return false;
        }
    }
    return true;
}



/*===================================================================================================
    微小な変化の定義
===================================================================================================*/


// 表示オブジェクトをランダムに 1 つ移動する
function minute_move(){
    // r 番目の要素を、自身のサイズに応じた分だけ動かす
    const r = Math.floor(Math.random() * ContentCount);
    if(r == ContentCount)i--; // 心配なので
    let node_r = NodeObjectsArray[r];

    const direction = Math.floor(Math.random() * 2);
    // 失敗した際に巻き戻す
    const memento = node_r.memento();
    if(direction%2){// y 方向
        const range_y = node_r.height(); 
        const next_y = node_r.y() - range_y/2 + Math.random()*range_y;
        node_r.set_y(Math.max(0, Math.min(next_y, RootFieldHeight-node_r.height())));
    }else{// x 方向
        const range_x = node_r.height(); 
        const next_x = node_r.x() - range_x/2 + Math.random()*range_x;
        node_r.set_x(Math.max(0, Math.min(next_x, RootFieldWidth-node_r.width())));
    }
    if(is_valid_state(r) == false){
        node_r.apply_memento(memento);
        return false;
    }
    return true;
}



// 表示オブジェクトをランダムに 1 つ拡大/縮小する
function minute_expand(){
    // r 番目の要素を、自身のサイズに応じた分だけ動かす
    const r = Math.floor(Math.random() * ContentCount);
    if(r == ContentCount)i--; // 心配なので
    let node_r = NodeObjectsArray[r];

    // 半分から 2 倍まで、拡大/縮小が等確率になるように
    const range_h = node_r.height();
    // 失敗した際に巻き戻す
    const memento = node_r.memento();
    // 変更後のサイズ
    let next_h = node_r.height()/2 + Math.random()*node_r.height()/2;// 縮小の場合
    if(Math.random()<0.5)next_h = node_r.height() + Math.random()*node_r.height();// 拡大の場合
    const next_w = next_h*ImageWHRatio;


    let overflow_h = 0;// 画面からはみ出した部分
    overflow_h = node_r.y() + next_h - RootFieldHeight;// 縦の overflow
    // 横の overflow を縦換算したもの
    overflow_h = Math.max(overflow_h, (node_r.x() + next_w - RootFieldWidth)*ImageWHRatio); 
    // セット
    if(overflow_h > 0)next_h -= overflow_h;
    node_r.set_height(Math.min(max_height, Math.max(min_height, next_h)));
    
    if(is_valid_state(r) == false){
        node_r.apply_memento(memento);
        return false;
    }
    return true;
}


// 位置をスワップする
function minute_swap(){
    const r1 = Math.floor(Math.random() * ContentCount);
    const r2 = Math.floor(Math.random() * ContentCount);
    if(r1 == r2)return false;

    let node1 = NodeObjectsArray[r1];
    let node2 = NodeObjectsArray[r2];

    const memento1 = node1.memento();
    const memento2 = node2.memento();

    // スワップ
    node1.apply_memento(memento2);
    node2.apply_memento(memento1);

    if(is_valid_state(r1) == false || is_valid_state(r2) == false){
        node1.apply_memento(memento1);
        node2.apply_memento(memento2);
        return false;
    }
    return true;
}


/*===================================================================================================
    最適化手続きの定義
===================================================================================================*/

// 定義されたノードオブジェクトの生成 & 配置の初期化
function generate_all(){
    Object.keys(node_property_json).forEach((key) => {
        NodeObjects[key] = new NodeBlock(key);
        NodeObjectsArray.push(NodeObjects[key]);
    });

    let size = min_height;
    let i = 0;
    let j = 0;
    
    for(const node_id in NodeObjects){
        let node = NodeObjects[node_id];
        node.set_height(size);
        
        node.set_x(j);
        node.set_y(i);
        i += size+5;
        if(i + size > RootFieldHeight){
            i = 0;
            j += size*ImageWHRatio + 5;
        }
    }
    
    

}





// テキトーに割り振る
function randomize_all(){
    // 最高スコア
    let best_score = eval_score();

    // これまででの最高スコアを達成する状態
    let best_condition = {};
    for(const node_id in NodeObjects){
        let node = NodeObjects[node_id];
        best_condition[node_id] = node.memento();
    }

    let iter_cnt = 50000;

    // 山登り
    while(true){
        const r = Math.floor(Math.random() * 4);
        if(r == 0){
            minute_move();
        }
        if(r == 1){
            minute_expand();
        }
        if(r == 2 || r == 3){
            minute_swap();
        }

        iter_cnt--;
        if(iter_cnt == 0)break;
        const score = eval_score();
        if(score > best_score){
            best_score = score;
            for(const node_id in NodeObjects){
                let node = NodeObjects[node_id];
                best_condition[node_id] = node.memento();
            }
        }
    }
    
    for(const node_id in NodeObjects){
        let node = NodeObjects[node_id];
        let memento = best_condition[node_id]
        node.apply_memento(memento);
    }
    

    console.log(best_score)
    console.log(eval_score_d1())
    console.log(eval_score_d2())
    console.log(eval_score_d3())

}





/*===================================================================================================
    手続き開始
===================================================================================================*/




// 一度だけ呼ばれる処理
function procedure_singleton(){
    generate_all();
    randomize_all();
    for(const node_id in NodeObjects){
        let node = NodeObjects[node_id];
        node.activate();
    }
    eval_score();
}

procedure_singleton();


/*===================================================================================================
    手続き終了
===================================================================================================*/