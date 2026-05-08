
/*===================================================================================================
    トグルボタン
===================================================================================================*/

// common.css の ToggleButtonField からクリック event を感知して呼び出される。
// html 構成も css を参照
function togglebutton(e){
    // トグルする対象のボタン要素の、フィールドとボタン
    let Field = document.getElementById(e.target.id);
    let Button = Field.firstElementChild;

    if(Field.dataset.toggleState == "0"){
        Field.dataset.toggleState = "1";

        // アニメーション
        Button.style.animation = "toggleButton_ON 0.4s both";
    }else{
        Field.dataset.toggleState = "0";

        Button.style.animation = "toggleButton_OFF 0.4s both";
    }
}



/*===================================================================================================
    表示/非表示切り替えボタン (ボタンの name 属性と同じ ID の要素の表示/非表示を切り替える)
===================================================================================================*/
function display_button(e){
    e.stopPropagation();
    let d_target = document.getElementById(e.target.getAttribute('name'));
    const dstate = window.getComputedStyle(d_target).display;

    if(dstate != "block")d_target.style.display = "block";
    else d_target.style.display = "none";
}



/*===================================================================================================
    スライド関連
===================================================================================================*/


// スライド表示の初期状態設定
function initialize_slide(){
    // ページ内のすべてのスライドそれぞれの代表要素 (ページ番号管理) を取得
    const slide_counters = document.getElementsByClassName("slide_pagenum_store");
    // それぞれのスライドについて、ページ表示を 1 ページ目で設定
    for(var i = 0 ; i < slide_counters.length ; i++){
        const pagenum = 0;
        const slidename = slide_counters[i].id;
        slide_counters[i].innerText = pagenum;
        var PageList = document.getElementsByClassName(slidename);
        if(PageList.length == 0)continue;
        PageList[pagenum].style.display = "block";
        set_slide_pagenum(slidename , pagenum+1 , PageList.length);
    }
}



// slidename のスライドのページ番号表示を a/b に
function set_slide_pagenum(slidename , a , b){
    var display_field = document.getElementsByClassName("slide_pagenum_field");
    for(var i = 0 ; i < display_field.length ; i++){
        if(display_field[i].title != slidename)continue;// 対象と関係ない部分は無視
        display_field[i].innerText = "(" + a + "/" + b + ")";
    }
}


// スライドを制御 : div 要素の name でスライド名を定義。 id = スライド名 の要素の innerText がページ番号に対応
function select_next(e){
    var PageList = document.getElementsByClassName(e.target.name);
    var counter_div = document.getElementById(e.target.name);
    var pagenum = parseInt(counter_div.innerText);
    const PageList_size = PageList.length;
    if(pagenum==PageList_size-1)return;
    //close current page
    PageList[pagenum].style.display = "none";
    pagenum++;
    //display next page
    PageList[pagenum].style.display = "block";
    counter_div.innerText = pagenum;//カウンターを更新
    // ページ移動した場合のみ変更 (& 1-index に変換)
    set_slide_pagenum(e.target.name , pagenum+1 , PageList_size);
}

function select_back(e){
    var PageList = document.getElementsByClassName(e.target.name);
    var counter_div = document.getElementById(e.target.name);
    var pagenum = parseInt(counter_div.innerText);
    const PageList_size = PageList.length;
    if(pagenum==0)return;
    //close current page
    PageList[pagenum].style.display = "none";
    pagenum--;
    //display next page
    PageList[pagenum].style.display = "block";
    counter_div.innerText = pagenum;//カウンターを更新
    // ページ移動した場合のみ変更 (& 1-index に変換)
    set_slide_pagenum(e.target.name , pagenum+1 , PageList_size);
}


/* ===========================================================================================
## ポップアップページ関連
=========================================================================================== */
const popup_outer_elementID = "unique_popup_window_outer";
const popup_elementID = "unique_popup_framewindow";

function close_popup(){
    const outer = document.getElementById(popup_outer_elementID);
    const res = confirm("内容は保存されません。ポップアップページを閉じますか？");
    if(!res)return;
    outer.style.visibility = "hidden";
}

function popup_page(link){
    if(link.length <= 0)return;
    if(link[0] != '.')return;// 危険なので相対リンクのみ
    const outer = document.getElementById(popup_outer_elementID);
    const frame = document.getElementById(popup_elementID);
    frame.src = link;
    outer.style.visibility = "visible";    
}


/*===================================================================================================
    手続き
===================================================================================================*/

initialize_slide();