/*===================================================================================================
    定数/変数
===================================================================================================*/

// ルートセレクタ
const g_root_selector = document.querySelector(':root');

// 今開いている記事の相対リンク
var opening_filename = "./TopPages/explain.html";

//history_cursor: page_historyの何番目の場所か
var history_cursor= 0;

//page_history : 開いた記事の履歴
var page_history = [];

// 今開いているフォルダの内容を表示している要素の ID
var opening_folderContentsID = null;

// ファイル選択時に項目一覧を閉じるか
var g_auto_close = 0;

// 現在ダークモードかどうか
var g_dark_mode = 0;

// 最上層に配置されているページボタン
const pages_on_top_layer = [
        "AboutThisPage_id" , 
        "WikiPage_id" ,
        "TechnicalReportPage_id"
    ];

/* 左の項目リストを覆うように、一時的にドアが開閉するアニメーションを起動する */
// アニメーションに別のものを指定することで再度起動することができるので、トグルで交互に指定して何度も呼び出す。
var BooleanForAnimationOfLeftDoor_ThisIsGlobal_SoItsNameMustBeUnique = true;


// 記事を拡大表示しているかどうか
let IsScalingFlag = 0;

// メニュー項目が開かれているか
let MenuOpenFlag = 0;



/*===================================================================================================
    状態変化の制御
===================================================================================================*/



// 他の要素の状態に依存して状態が変わる要素を一括でリフレッシュ 
function refresh_state(){
    // 履歴ボタンの状態の制御
    let BackButton = document.getElementById("HistoryGoback");
    let ForwardButton = document.getElementById("HistoryGoforward"); 
    if(history_cursor == 0)BackButton.style.opacity = "0.5";
    else{
        BackButton.style.opacity = "1";
        BackButton.style.color = "var(--tool-bar-font-color)";
    }

    if(history_cursor+1 >= page_history.length)ForwardButton.style.opacity = "0.5";
    else{
        ForwardButton.style.opacity = "1";
        ForwardButton.style.color = "var(--tool-bar-font-color)";
    }

    // ダークモードの制御
    if(g_dark_mode == 0){// 通常
        g_root_selector.style.setProperty('--top-bar-bg-color', '#F2F3F4');
        g_root_selector.style.setProperty('--top-bar-font-color', '#333132');
        g_root_selector.style.setProperty('--leftside-itemlist-bg-color', '#FAFBFD');
        g_root_selector.style.setProperty('--leftside-itemlist-font-color', 'black');
        g_root_selector.style.setProperty('--folder-category-color','black');
        g_root_selector.style.setProperty('--folderitem-color','#D3D9DE');
        g_root_selector.style.setProperty('--folderitem-font-color', 'black');
        g_root_selector.style.setProperty('--fileitem-color','rgb(40, 98, 53)');
        g_root_selector.style.setProperty('--fileitem-font-color', 'black');
        g_root_selector.style.setProperty('--colsefolder-button-color', '#73799F');
        g_root_selector.style.setProperty('--tool-bar-bg-color', '#F2F3F4');
        g_root_selector.style.setProperty('--tool-bar-font-color', '#black');
    }else{// ダークモード
        g_root_selector.style.setProperty('--top-bar-bg-color', '#00122F');
        g_root_selector.style.setProperty('--top-bar-font-color', '#F2F3F4');
        g_root_selector.style.setProperty('--leftside-itemlist-bg-color', '#00122F');
        g_root_selector.style.setProperty('--leftside-itemlist-font-color', 'white');
        g_root_selector.style.setProperty('--folder-category-color','white');
        g_root_selector.style.setProperty('--folderitem-color','#F2F3F4');
        g_root_selector.style.setProperty('--folderitem-font-color', 'black');
        g_root_selector.style.setProperty('--fileitem-color','#F2F3F4');
        g_root_selector.style.setProperty('--fileitem-font-color', 'black');
        g_root_selector.style.setProperty('--colsefolder-button-color', 'white');
        g_root_selector.style.setProperty('--tool-bar-bg-color', '#00122F');
        g_root_selector.style.setProperty('--tool-bar-font-color', '#F2F3F4');
    }
}




/*===================================================================================================
    左の項目一覧の制御
===================================================================================================*/



// LeftDoorAnimation は、0.12s ~ 0.28s の間、左の項目リストを覆い隠す
function RunAnimation_LeftDoor(){
    // どちらのアニメーションも同じ
    const AnimationStyle_Type1 = "LeftDoorAnimation 0.4s both";
    const AnimationStyle_Type2 = "LeftDoorAnimation_back 0.4s both";
    let leftdoor = document.getElementById("LeftDoor");
    
    if(BooleanForAnimationOfLeftDoor_ThisIsGlobal_SoItsNameMustBeUnique)leftdoor.style.animation = AnimationStyle_Type2;
    else leftdoor.style.animation = AnimationStyle_Type1;
    BooleanForAnimationOfLeftDoor_ThisIsGlobal_SoItsNameMustBeUnique = !BooleanForAnimationOfLeftDoor_ThisIsGlobal_SoItsNameMustBeUnique;
}


// 左の項目リストを開く
function Scaling_LeftDoor(){/*記事内容の拡大・縮小(アニメーションクラスを付与する)*/
    const page_contents = document.getElementById('PageContents');
    const itemlist = document.getElementById('ItemList');        
    const scalingbutton = document.getElementById('ScalingButton');
    
    if(!IsScalingFlag){
        page_contents.style.animation = 'Contents_shrink 0.72s both';//アニメーションon
        scalingbutton.style.animation = 'ScalingButton_MoveLeft 0.72s both';//アニメーションon
        itemlist.style.animation = 'ItemList_shrink 0.72s both';//アニメーションon

        scalingbutton.innerHTML = '<br>&nbsp;メ<br>&nbsp;ニ<br>&nbsp;ュ<br>&nbsp;|<br>';// ボタンの文章を変更
    }else{
        page_contents.style.animation = 'Contents_expand 0.72s both';
        scalingbutton.style.animation = 'ScalingButton_MoveRight 0.72s both';
        itemlist.style.animation = 'ItemList_expand 0.72s both';//アニメーションon
        
        scalingbutton.innerHTML = '<br>&nbsp;閉<br>&nbsp;じ<br>&nbsp;る<br>';// ボタンの文章を変更
    }
    IsScalingFlag^=1;
    return true;
}


/*===================================================================================================
    表示履歴管理
===================================================================================================*/



// 履歴に追加(現在見ているページ以降で、すでに追加されている履歴は削除)
function add_history(pURL){
    while(page_history.length > history_cursor + 1 && page_history.length !=0){
        page_history.pop();
    }
    history_cursor= page_history.length;
    page_history.push(pURL);
    refresh_state();
}

//履歴を遡る
function goback_history(){
    if(history_cursor<=0 || page_history.length<=0){
        //何もしない
    }else{
        history_cursor--;
        FileSet(page_history[history_cursor]);
    }
    refresh_state();
}


//次の履歴に
function goforward_history(){
    if(history_cursor >=  page_history.length - 1 || page_history.length<=0){
        //何もしない
    }else{
        history_cursor++;
        FileSet(page_history[history_cursor]);
    }
    refresh_state();
}


/*===================================================================================================
    メニューボタン制御
===================================================================================================*/


function OpenMenu(){
    let elem = document.getElementById("MenuFieldID");
    if(MenuOpenFlag)elem.style.animation = "MenuField_disappear 0.24s both";    
    else elem.style.animation = "MenuField_appear 0.24s both";  
    MenuOpenFlag^=1;
}




/*===================================================================================================
    ファイル/フォルダ 管理
===================================================================================================*/



// フォルダの中身を開き、項目一覧に表示する
function OpenFolder(e){
    const folderContentsField = document.getElementById(e.target.name);
    const categories = document.getElementsByClassName('CategoryField');
    const CloseFolderButtons = document.getElementsByClassName('CloseFolderButton');
    
    /* アニメーション起動後、項目リストが 0.12s ~ 0.28s の間隠れる */
    RunAnimation_LeftDoor();

    /* 項目リストが隠れてから、項目の表示を変える操作を行う */
    setTimeout(()=>{  
        opening_folderContentsID = e.target.name;
        // カテゴリ一覧 (その中にフォルダのヘッダがある) を非表示、フォルダを閉じるボタンを表示
        for(var i = 0 ; i < categories.length ; i++)categories[i].style.display = "none";
        for(var i = 0 ; i < CloseFolderButtons.length ; i++)CloseFolderButtons[i].style.display = "block";
        for(let i = 0 ; i < pages_on_top_layer.length ; i++){
            document.getElementById(pages_on_top_layer[i]).style.display = "none";
        }
        folderContentsField.style.display = 'block';
    }, 200);
}

// 今開いてるフォルダを閉じ、フォルダ一覧に戻る
function CloseFolder(){
    const folder_target = document.getElementById(opening_folderContentsID);
    const categories = document.getElementsByClassName('CategoryField');
    const CloseFolderButtons = document.getElementsByClassName('CloseFolderButton');

    /* アニメーション起動後、項目リストが 0.12s ~ 0.28s の間隠れる */
    RunAnimation_LeftDoor();

    /* 項目リストが隠れてから、項目の表示を変える操作を行う */
    setTimeout(()=>{  
        // カテゴリ一覧 (その中にフォルダのヘッダがある) を表示、フォルダを閉じるボタンを非表示
        for(var i = 0 ; i < categories.length ; i++)categories[i].style.display = "block";
        for(var i = 0 ; i < CloseFolderButtons.length ; i++)CloseFolderButtons[i].style.display = "none";
        for(let i = 0 ; i < pages_on_top_layer.length ; i++){
            document.getElementById(pages_on_top_layer[i]).style.display = "block";
        }
        folder_target.style.display = 'none';
        opening_folderContentsID = null;
    }, 200);
}



// 開くファイルを指定
// 双対パス以外は受け付けない(外部サイトを開きたくないので)
function FileSet(fname){
    if(fname[0] != '.')return;
    document.getElementById('ArticleField').src = fname;
    opening_filename = fname;
    // 履歴に追加 
    if(page_history.length == 0 || page_history[history_cursor] != fname)add_history(fname);
}



/*===================================================================================================
    内部パラメータ制御
===================================================================================================*/

// 自動開閉フラグの ON/OFF の切り替え
function toggle_autoclose(){
    g_auto_close^=1;
}

// 内部のダークモードフラグの ON/OFF の切り替え
function toggle_darkmode(){
    g_dark_mode^=1;
}

/*===================================================================================================
    パラメータに依存した、クライアント側での処理
===================================================================================================*/

// ダークモードに変更&画面切り替え
function change_display_mode(){
    toggle_darkmode();
    refresh_state();
}


// 表示ファイルのセット & 自動開閉
function OpenPage(e){
    FileSet(e.target.name);
    /*「自動でメニューを閉じる」が選択されているなら、自動で閉じる */
    if(g_auto_close == 1)Scaling_LeftDoor();
}



/*===================================================================================================
    記事リンクの共有
===================================================================================================*/

// 今開いている記事のリンクをクリップボードにコピー。  
// のはずが、よく分からずなので、別タブで記事ページにリダイレクト
function shareURL(){
    let link_ = String(location.href);
    // 必ず ???/index.html になってる
    while(true){
        let back_ = link_.slice(link_.length-1,link_.length);
        link_ = link_.slice(0,link_.length-1);
        if(back_ == '/')break;
    }
    // 必ず './' から始まる相対パス
    // 必ず './' から始まる相対パス
    var file_ = opening_filename;
    file_ = file_.slice(1,file_.length);
    window.open(link_+file_, '_blank');
}


/*===================================================================================================
    手続き
===================================================================================================*/

// 初期ページ (履歴ボタンの色などの初期化を含む)
FileSet(opening_filename);