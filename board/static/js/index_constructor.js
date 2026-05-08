// requires common_constructor, common.css
// requires TimeLineAPI

/*===================================================================================================
## 変数
===================================================================================================*/
const c_debug_mode_button_id = "debug_mode_button_id";
var is_debug_mode = false;



/*===================================================================================================
## 関数
===================================================================================================*/



// url パラメータを見て、ページを開く
function page_routing(){
    const params = new URLSearchParams(window.location.search);
    const id = params.get("post_id");
    if(!id)return;
    const post = TimeLineAPI.get_post(id);
    if(!post)return;
    const link = post.generate_link(id);
    if(!link)return;
    popup_page(link);
}


// common.css の ToggleButtonField からクリック event を感知して呼び出される。
function switch_debug_mode(e){
    // トグルする対象のボタン要素の、フィールドとボタン
    let Field = document.getElementById(e.target.id);
    let Button = Field.firstElementChild;

    const all_page_elem = document.getElementById("page_all_id");

    if(Field.dataset.toggleState == "0"){
        Field.dataset.toggleState = "1";
        all_page_elem.className = "page_all_debug";

        // アニメーション
        Button.style.animation = "toggleButton_ON 0.4s both";
    }else{
        Field.dataset.toggleState = "0";
        all_page_elem.className = "page_all";

        Button.style.animation = "toggleButton_OFF 0.4s both";
    }
}




/*===================================================================================================
## 手続き
===================================================================================================*/

// ポスト情報をフェッチする
TimeLineAPI.fetch_posts();

// 投稿者情報をフェッチして反映する
page_routing();

