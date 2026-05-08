/*===================================================================================================
    定数
===================================================================================================*/

const target_SampleCodeField = "SampleCode";
const target_HideCheckButton = "HideCheck";

/*===================================================================================================
    サンプルコードの開閉
===================================================================================================*/

function toggleSampleCodeDisplay(){
    let Field = document.getElementById(target_SampleCodeField);
    let Button = document.getElementById(target_HideCheckButton);
    // サンプルコードフィールドの表示切り替え
    if(Field.style.display == "none")Field.style.display = "block";
    else Field.style.display = "none";
    // ボタンの表示切り替え
    if(Button.style.display == "none")Button.style.display = "block";
    else Button.style.display = "none";
}

