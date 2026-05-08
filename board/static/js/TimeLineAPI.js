// require time.js
// require common_constructor.js


// 検索スコア
// 検索に引っ掛からなかったら 0 
function search_score(str , patterns = []){
    if(patterns.length == 0)return 1;
    var score = 0;
    
    for(var i = 0 ; i < patterns.length ; i++){
        const ptn = patterns[i];
        var found = false;
        for(var l = 0 ; l < str.length-ptn.length+1 ; l++){
            const substr = str.slice(l, l+ptn.length);
            if(substr == ptn){
                found = true;
                break;
            }
        }
        if(found){
            score++;
            continue;
        }
    }
    return score;
}





// 投稿者データ
class Profile{
    constructor(username, user_category, image_src, introduction){
        this.m_name = username;
        this.m_user_category = user_category;
        this.m_iconimage_src = image_src;
        this.m_introduction = introduction;
    }

    introduction(){
        return this.m_introduction;
    }

    icon_source(){
        return this.m_iconimage_src;
    }

    user_name(){
        return this.m_name;
    }

    user_category(){
        return this.m_user_category;
    }

    // プロフィール情報の html 要素を生成して返す
    person_html_item(){
        const new_personitem = document.createElement("div");
        const new_icon_column = document.createElement("div");
        const new_icon = document.createElement("img");
        const new_textwrapper = document.createElement("div");
        const new_username = document.createElement("div");
        const new_state = document.createElement("div");
        const new_content = document.createElement("div");

        new_personitem.className = "person_item";
        new_icon_column.className = "profile_icon_column";
        new_icon.className = "profile_icon";
        new_textwrapper.className = "profile_textwrapper";
        new_username.className = "profile_username";
        new_state.className = "profile_subinfo";
        new_content.className = "profile_content";

        new_personitem.appendChild(new_icon_column);
        new_icon_column.appendChild(new_icon);
        new_personitem.appendChild(new_textwrapper);

        new_textwrapper.appendChild(new_username);
        new_textwrapper.appendChild(new_state);
        new_textwrapper.appendChild(new_content);
        
        

        new_icon.src = this.icon_source();
        new_username.innerText = this.user_name();
        new_state.innerText = this.user_category() + " 担当";
        new_content.innerText = this.introduction();

        return new_personitem;
    }
};


// 投稿データ
class PostData{
    constructor(user_data, text, post_image_src, 
        time_data, post_id, post_priority, contents_link){
        this.m_user_data = user_data;
        this.m_post_text = text;
        this.m_post_image = post_image_src;
        this.m_post_time = time_data;
        this.m_post_id = post_id;
        this.m_post_priority = post_priority;
        this.m_contents_link = contents_link;
        this.m_normal_display_priority = 0;// 通常コンテナ内での順序
    }


    set_normal_display_priority(p=0){
        this.m_normal_display_priority = p;
    }

    normal_display_priority(){
        return this.m_normal_display_priority;
    }

    user_data(){
        return this.m_user_data;
    }

    contents_link(){
        return this.m_contents_link;
    }

    // ポストが優先ポストかどうか (bool)
    post_priority(){
        return this.m_post_priority;
    }

    post_text(){
        return this.m_post_text;
    }

    // [Y,M,D,H,m,s]
    post_time(){
        return this.m_post_time;
    }

    // link
    post_image(){
        return this.m_post_image;
    }

    post_id(){
        return this.m_post_id;
    }


    static generate_link_param_icon_src(){return "icon_src";}
    static generate_link_param_user_name(){return "user_name";}
    static generate_link_param_category(){return "category";}

    // ポスト情報から、ページ構築のためのパラメータとともにリンクを生成する
    generate_link(){
        // 記事のリンクデータを構築
        var link = "";
        link += this.contents_link();
        
        if(link === undefined || link.length <= 3)return;

        // アイコン画像、名前、カテゴリ は必ずあるので
        link += "?"+PostData.generate_link_param_icon_src()+"=" + this.user_data().icon_source();
        link += "&"+PostData.generate_link_param_user_name()+"=" + this.user_data().user_name();
        link += "&"+PostData.generate_link_param_category()+"=" + this.user_data().user_category();
        
        return link;
    }

    // ポストの html 要素を作って返す
    make_postelem(post_priority = false){
        const new_postfield = document.createElement("div");
        const new_icon_column = document.createElement("div");
        const new_icon = document.createElement("img");
        const new_textwrapper = document.createElement("div");
        const new_username = document.createElement("div");
        const new_state = document.createElement("div");
        const new_content = document.createElement("div");
        const new_thumbnail = document.createElement("img");
        
        // 優先ポストかどうかで、格納先が変わる
        if(post_priority){
            new_postfield.className = "priority_post_item";
        }else{
            new_postfield.className = "post_item";
        }

        new_icon_column.className = "post_icon_column";
        new_icon.className = "profile_icon";
        new_textwrapper.className = "post_textwrapper";
        new_username.className = "post_username";
        new_state.className = "post_state";
        new_content.className = "post_content";
        new_thumbnail.className = "post_thumbnail";

        new_postfield.appendChild(new_icon_column);
        new_icon_column.appendChild(new_icon);
        new_postfield.appendChild(new_textwrapper);

        new_textwrapper.appendChild(new_username);
        new_textwrapper.appendChild(new_state);
        new_textwrapper.appendChild(new_content);

        new_icon.src = this.user_data().icon_source();
        new_username.innerText = this.user_data().user_name();
        

        // 日付で表示を変更
        let state_str = "";
        new_state.innerText = "";
        new_content.innerText = "";

        if(this.contents_link() !== undefined && this.contents_link().length >= 3){
            state_str += "🔗 ";
            new_content.innerText += "(タップで開く)\n";
        }

        new_content.innerText += this.post_text();

        state_str += "カテゴリ:" + this.user_data().user_category();
        if(post_priority){
            state_str += " \n ";
        }else {
            state_str += " - ";
        }
        

        const post_datetime = this.post_time();
        const now = new Date();
        const Ynow = now.getFullYear();
        const Mnow = now.getMonth()+1;// 0-index
        const Dnow = now.getDate();
        const Hnow = now.getHours();
        const mnow = now.getMinutes();
        const Snow = now.getSeconds();

        let state_datetime = "";
        if(post_datetime[0] != Ynow){
            state_datetime = post_datetime[0]+"年"+post_datetime[1]+"月"+post_datetime[2]+"日";
        }else{
            const time_diff = timecount(Ynow,Mnow,Dnow,Hnow,mnow,Snow) 
                - timecount(post_datetime[0],post_datetime[1],post_datetime[2],post_datetime[3],post_datetime[4],post_datetime[5]);
            const date_diff = Math.floor(time_diff/86400);
            if(date_diff > 6){
                state_datetime = post_datetime[1]+"月"+post_datetime[2]+"日";
            }else if(date_diff == 0){
                
                const hour_diff = Math.floor((time_diff)/3600);
                if(hour_diff != 0)state_datetime = hour_diff+"時間前";
                else{
                    const minute_diff = Math.floor((time_diff)/60);
                    if(minute_diff !=0 )state_datetime = minute_diff+"分前";
                    else state_datetime = time_diff+"秒前";
                }
            }else{
                state_datetime = date_diff+"日前";
            }
        }
        state_str += state_datetime;
        if(!post_priority){
            state_str +=" #"+this.post_id();
        }
        new_state.innerText += state_str;

        // 相対リンクのみ
        if(!post_priority && this.post_image() !== undefined 
            && this.post_image()[0] == '.'){
            new_textwrapper.appendChild(new_thumbnail);
            new_thumbnail.src = this.post_image();
        }
        
        new_postfield.addEventListener("click", (event) => {
            var link = "";
            link += this.generate_link();
            if(link === undefined || link.length <= 3)return;
            
            popup_page(link);
        });

        return new_postfield;
    }

};



// タイムライン操作
// ユーザリスト、ポストリスト、フィルタの 3 つを担当
const TimeLineAPI = new class{
    constructor(){
        this.c_postcontainer_id = "PostContainerID";
        this.c_priority_postcontainer_id = "PriorityPostContainerID";

        this.c_postcontainer_elem = document.getElementById(this.c_postcontainer_id);

        // 構築せず、TimeLineAPI に登録された定数だけアクセスする場合
        if(this.c_postcontainer_elem == null)return;
        

        this.c_priority_postcontainer_elem = document.getElementById(this.c_priority_postcontainer_id);

        this.c_post_priority_symbol = "1";

        this.m_post_data = [];
        this.m_priority_post_data = [];

        // ポスト情報を持つ要素のクラス名
        this.c_post_data_classname = "post_data";

        // 投稿者情報を持つ要素のクラス名
        this.c_people_data_classname = "person_data";
        this.c_people_data_container_id = "person_list";
        this.c_people_data_container_elem = document.getElementById(this.c_people_data_container_id);
        
        // カテゴリから投稿者への索引
        this.c_poerson_dict = {};

        // フィルター情報を格納する部分
        this.c_filterstate_container_id = "filter_state_list_id";
        this.c_filterstate_container_elem = document.getElementById(this.c_filterstate_container_id);

        // フィルター要素
        this.c_filter_date_from_id = "filter_date_from_id";
        this.c_filter_date_to_id = "filter_date_to_id";
        this.c_filter_category_id = "filter_category_id";
        this.c_filter_keyword_id = "filter_keyword_id";

        this.c_filter_category_list_elem = document.getElementById(this.c_filter_category_id);

        // デフォルトカテゴリをリストに追加
        this.c_filter_default_category = "すべて";
        const default_category = document.createElement("option");
        default_category.value = this.c_filter_default_category;
        default_category.innerText = this.c_filter_default_category;
        this.c_filter_category_list_elem.appendChild(default_category);


        // 投稿者
        const people = document.getElementsByClassName(this.c_people_data_classname);
        
        for(let i = 0 ; i < people.length ; i++){
            const person = people[i];
            // data-* の構文
            const icon_link = person.dataset.iconLink;
            const post_category = person.dataset.postCategory;
            const user_name = person.dataset.userName;
            const introduction = person.innerText;
            const user = new Profile(user_name, post_category, icon_link, introduction);
            this.c_poerson_dict[post_category] = user;
            
            const user_html = user.person_html_item();
            user_html.addEventListener("click" ,async ()=>{this.fetch_posts(post_category);});

            this.c_people_data_container_elem.appendChild(user_html);

            // 担当カテゴリをカテゴリリストに追加
            const new_category = document.createElement("option");
            new_category.value = post_category;
            new_category.innerText = post_category;
            this.c_filter_category_list_elem.appendChild(new_category);
        }
        
        // デフォルト投稿者
        this.c_filter_default_category = "？？？";
        this.c_default_user = new Profile("ほっぺプニ太郎" , this.c_filter_default_category, "./static/image/oko_dot_icon.png", "私、なんでもやります。");
        this.c_poerson_dict[this.c_default_user.user_category()] = this.c_default_user;
        const default_user_html = this.c_default_user.person_html_item();
        default_user_html.addEventListener("click" ,async ()=>{this.fetch_posts(this.c_default_user.user_category());});
        this.c_people_data_container_elem.appendChild(default_user_html);
        

    }

    // カテゴリから、そのカテゴリを担当する人物データを取得する
    get_category_user(category){
        if(category in this.c_poerson_dict)return this.c_poerson_dict[category];
        return this.c_default_user;
    }

    // id からポストを取得 (現在表示中のもののみ)
    get_post(id){
        for(let i = 0 ; i < this.m_post_data.length ; i++){
            if(this.m_post_data[i].post_id() != id)continue;
            return this.m_post_data[i];
        }
        return null;
    }


    // ポストをタイムラインに追加し、$$$$ 自身が管理するポスト一覧にも追加する $$$$
    add_post(post_datum){
        if(post_datum.post_priority()){
            this.c_priority_postcontainer_elem.prepend(post_datum.make_postelem(true));
            this.m_priority_post_data.push(post_datum);
        }
        this.c_postcontainer_elem.prepend(post_datum.make_postelem(false));
        this.m_post_data.push(post_datum);
    }

    // 全て消す
    delete_all_post(){
        
        this.m_post_data = [];
        this.c_postcontainer_elem.replaceChildren();
        
        this.m_priority_post_data = [];
        this.c_priority_postcontainer_elem.replaceChildren();
        
    }

    // タイムラインの状態を整理する
    reflesh_timeline(){
        var skip_addtion = false;
        if(this.m_post_data.length == 0){
            this.c_postcontainer_elem.innerHTML = "<h3>表示するポストがありません</h3>";
            skip_addtion = true;
        }

        if(this.m_priority_post_data.length == 0){
            this.c_priority_postcontainer_elem.innerHTML = "<h3>表示するポストがありません</h3>";
            skip_addtion = true;
        }

        if(skip_addtion)return;
        
        // (優先度,時間順) の辞書順でソート
        this.m_post_data.sort((d1, d2) => {
            const p1 = d1.normal_display_priority();
            const p2 = d2.normal_display_priority();
            if(p1 < p2)return -1;
            if(p1 > p2)return 1;

            const dd1 = d1.post_time();  
            const dd2 = d2.post_time();  
            const t1 = timecount(dd1[0],dd1[1],dd1[2],dd1[3],dd1[4],dd1[5]);
            const t2 = timecount(dd2[0],dd2[1],dd2[2],dd2[3],dd2[4],dd2[5]);
            
            if(t1 < t2)return -1;
            if(t1 > t2)return 1;
            return 0;
        });

        this.c_postcontainer_elem.replaceChildren();
        this.c_postcontainer_elem = document.getElementById(this.c_postcontainer_id);

        for(var i = 0 ; i < this.m_post_data.length ; i++){
            this.c_postcontainer_elem.prepend(this.m_post_data[i].make_postelem());
        }
    }

    
    /* =============================================================================
        # ポストデータからデータを取得し、表示する
        オプションはデフォルト値では無効
        - target_category : 表示対象カテゴリ
        - search_patterns : 検索文字列のリスト
        - [date_from, date_to] : 日付の区間 (YYYY/MM/DD hh:mm:ss) 形式
    ============================================================================= */
    fetch_posts(target_category = null, search_patterns = null, date_from = null, date_to = null){
        this.delete_all_post();
        const posts = document.getElementsByClassName(this.c_post_data_classname);
        
        for(let i = 0 ; i < posts.length ; i++){
            const post = posts[i];
            // data-* の構文
            var post_category = post.dataset.postCategory;
            const post_link = post.dataset.postLink;
            const post_time = post.dataset.postTime;
            const post_title = post.dataset.postTitle;
            const post_priority = post.dataset.postPriority;
            const post_id = post.dataset.postId;
            const post_thumbnail = post.dataset.postThumbnail;

            if(post_category === undefined || post_category == "")post_category = this.c_filter_default_category;

            // フィルタ処理
            if(target_category != null && target_category != post_category)continue;

            const postdate_params = parseYMDHMS(post_time);

            // 検索スコア
            var score = 1;
            if(search_patterns != null)score = search_score(post_title, search_patterns);
            if(score == 0)continue;

            // 日時の比較は形式が一定なので辞書順で OK
            if(date_from && post_time < date_from)continue;
            if(date_to && post_time > date_to)continue;
            
            
            var new_post = new PostData(this.get_category_user(post_category), post_title, post_thumbnail ,
                postdate_params , post_id, (post_priority==this.c_post_priority_symbol) , post_link);
            new_post.set_normal_display_priority(score);// 表示優先度
            
            this.add_post(new_post);
        }

        // フィルター情報を更新する
        this.c_filterstate_container_elem.replaceChildren();
        var no_filter = true;

        if(target_category){
            no_filter = false;
            const new_filteritem = document.createElement("span");
            this.c_filterstate_container_elem.appendChild(new_filteritem);
            new_filteritem.className = "filter_state_item";
            new_filteritem.innerText = "カテゴリ : " + target_category;   
        }

        if(date_from){
            no_filter = false;
            const new_filteritem = document.createElement("span");
            this.c_filterstate_container_elem.appendChild(new_filteritem);
            new_filteritem.className = "filter_state_item";
            new_filteritem.innerText = "from : " + date_from;
        }

        if(date_to){
            no_filter = false;
            const new_filteritem = document.createElement("span");
            this.c_filterstate_container_elem.appendChild(new_filteritem);
            new_filteritem.className = "filter_state_item";
            new_filteritem.innerText = "to : " + date_to;
        }

        if(search_patterns){
            no_filter = false;
            for(var i = 0 ; i < search_patterns.length ; i++){
                const new_filteritem = document.createElement("span");
                this.c_filterstate_container_elem.appendChild(new_filteritem);
                new_filteritem.className = "filter_state_item";
                new_filteritem.innerText = "キーワード : " + search_patterns[i];   
            }
        }

        // フィルターなし
        if(no_filter){
            const new_filteritem = document.createElement("span");
            this.c_filterstate_container_elem.appendChild(new_filteritem);
            new_filteritem.className = "filter_state_item";
            new_filteritem.innerText = "なし";
        }else{
            const clear_filter_button = document.createElement("span");
            this.c_filterstate_container_elem.appendChild(clear_filter_button);
            clear_filter_button.className = "clear_filter_button";
            clear_filter_button.innerText = "×フィルタをクリア";
            clear_filter_button.addEventListener("click", ()=>{
                this.fetch_posts();// デフォルト
            });
        }

        // 状態を整理する
        this.reflesh_timeline();
    }




    // フィルターを実行
    execute_filter(){
        var date_from = document.getElementById(this.c_filter_date_from_id).value;
        var date_to = document.getElementById(this.c_filter_date_to_id).value;
        var category = document.getElementById(this.c_filter_category_id).value;
        const keyword = document.getElementById(this.c_filter_keyword_id).value;

        
        // "yyyy/mm/dd" までだから追加
        if(date_from && date_from != ""){
            date_from += " 00:00:00";
            date_from = date_from.replaceAll("-", "/");

            var y_str = "";
            for(var i = 0 ; date_from[i] != '/'; i++)y_str += date_from[i];
            
            if(parseInt(y_str)>9999){
                date_from = null;
                alert("10000/1/1 以降の日付はサポートしていません。");
            }
        }else{
            date_from = null;
        }

        if(date_to && date_to != ""){
            date_to += " 23:59:59";
            date_to = date_to.replaceAll("-", "/");

            var y_str = "";
            for(var i = 0 ; date_to[i] != '/'; i++)y_str += date_to[i];
            
            if(parseInt(y_str)>9999){
                date_to = null;
                alert("10000/1/1 以降の日付はサポートしていません。");
            }
        }else{
            date_to = null;
        }

        if(category == this.c_filter_default_category)category = null;

        var keywords = null;
        if(keyword)keywords = keyword.trim().split(/\s+/);
        if(keywords && keywords.length == 0)keywords = null;
        
        this.fetch_posts(category, keywords, date_from , date_to);
    }

};


