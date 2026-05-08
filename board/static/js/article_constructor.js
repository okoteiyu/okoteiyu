// requires common_constructor, common.css
// requires TimeLineAPI::staticFuncs

/*===================================================================================================
## 変数
===================================================================================================*/

const c_text_block_class = "text_block";
const c_listener_text_block_class = "text_block_listener";
const c_text_block_icon_class = "text_block_icon";
const c_person_field = "post_person";
const c_category_field = "post_category";


/*===================================================================================================
## 関数
===================================================================================================*/


function construct(){
    const params = new URLSearchParams(window.location.search);
    const src = params.get(PostData.generate_link_param_icon_src());
    const person_name = params.get(PostData.generate_link_param_user_name());
    const category = params.get(PostData.generate_link_param_category());

    if(person_name)document.getElementById(c_person_field).innerText = person_name + " (投稿者)　";
    if(category)document.getElementById(c_category_field).innerText =  category  + " (カテゴリ)";

    // アイコンデータをテキストブロックに挿入していく
    if(!src || src.length <= 3)src = "./static/image/default_icon.jpg";
    
    const text_blocks = document.getElementsByClassName(c_text_block_class);
    const text_blocks_listener = document.getElementsByClassName(c_listener_text_block_class);
    for(var i = 0 ; i < text_blocks.length ; i++){
        const new_icon = document.createElement("img");
        new_icon.className = c_text_block_icon_class;
        // board/static/image 以下のもののみ割り当て可能
        new_icon.src = "/board/"+src;
        text_blocks[i].prepend(new_icon);
    }

    for(var i = 0 ; i < text_blocks_listener.length ; i++){
        const new_icon = document.createElement("img");
        new_icon.className = c_text_block_icon_class;
        // board/static/image 以下のもののみ割り当て可能
        new_icon.src = "/board/static/image/Listener.jpeg";
        text_blocks_listener[i].prepend(new_icon);
    }    
}

/*===================================================================================================
## 手続き
===================================================================================================*/

construct();