$(function () {
    $("body").css("background-color", "#ffffffff");

    //---------------検索ボタンを押したとき---------------------------
    $("#btn_All").on("click",function () {
        const kenmei = $("#pref_sel").val();

        const postVal = $("#post_code").val();
        const keyVal = $("#search_keyword").val();

        const modeVal = $("input[name='mode']:checked").val();//AND,OR検索の値

        /*
        MEMO
        no = i;
        post_code = code[0];
        prefecture = code[4];
        city = code[5];
        town = code[6];
        */
       
        if (!kenmei) {
            alert("都道府県を選択してください。")
            return;
        }
            
        //県の読み込み
        $.ajax({
                url: `csv/${kenmei}.csv`,
                dataType: "text",
                success: function (data) {
                    console.log(`${kenmei}CSVを確認`);

                    const all_array = data.split(/\r\n/);

                    //地図非表示
                    $("#map_area").hide();
                    $("#map_iframe").attr("src", "");


                    let result = [];//resultの空の配列を用意。複数いれるため。
                    //----------検索の処理---------------------------------------

                    // ▼条件が空で、都道府県だけを選択した場合は全リストを出す
                    if (postVal === "" && keyVal === "") {
                            $.each(all_array, function (index, item) {
                                const code = item.split(",");
                                result.push(
                                    // push:末尾に要素を追加するメソッド
                                    `<tr>
                                            <td>${code[0]}</td>
                                            <td>${code[4]}</td>
                                            <td>${code[5]}</td>
                                            <td>${code[6]}</td>
                                            <td id="furigana">${code[3]}</td>
                                    </tr>`
                                );
                            });
                        } else {
                            // ▼条件を入力した場合
                            // each:繰り返し実行する処理
                            // 取得したデータからそれぞれ取り出す
                            $.each(all_array, function (index, item) {
                                const code = item.split(",");

                                //条件
                                const cond_post = postVal !== "" && code[0].includes(postVal);
                                /*includes:含まれているかをみるメソッド　
                                ※cond condition(条件)
                                postVal !== "" ⇒ 空欄の場合は、falseにする
                                理由：.incliudes()に空文字を入れると常にtrueになるため
                                空欄でなければ等しくないのでtrueになる && postValを見れる！
                                ※!==:厳密不等価演算子　
                                */
                            
                               let cond_key = true;//空欄の時もtrueにするため。再代入するためlet
                               if (keyVal !== "") {
                                const parts = keyVal.split(/\s+/);
                                // \s+:１つ以上の空白（ｽﾍﾟｰｽや改行など） 　空白で分割するため。
                                // 各単語が code[5] または code[6] に含まれているか確認
                                const keyword = code[5] + code[6] + code[3];
                                //検索対象の文字列を結合

                                cond_key = parts.every(a =>
                                    code[5].includes(a) ||
                                    code[6].includes(a) ||
                                    code[3].includes(a) ||
                                    keyword.includes(a)
                                );
                                // every():配列の各要素に対して処理して１つでもfalseがあれば
                                // →falseを返すメソッド。全部trueならtrue
                                // →　[基本]配列.every(要素　=> 条件式)

                                // a => ... アロー関数
                                // aは、parts配列から取り出した値を受け取る変数
                               }
                               
                                let condition = [];
                                if (postVal !== "") condition.push(code[0].includes(postVal));
                                // 郵便番号が空だったら処理しない。入っていれば、CSVファイルに入力の値が
                                // 含まれているかをチェックする⇒trueかfalseをだす。trueならconditionの配列に追加
                                if (keyVal !== "") condition.push(cond_key);
                            

                                let match = false; //該当するものがあればtrueを出したいので初期値をfalseをする。

                                // AND検索　入力されている内容をすべて満たす
                                if (modeVal === "AND") {
                                    match = condition.every(x => x);
                                    // every:配列内のすべての要素がtrueかどうかを判定するメソッド
                                } else {
                                    // OR検索　いずれか条件でOK
                                    match = condition.some(x => x);
                                    // some: 配列内のいずれかがtrueかを判定するメソッド
                                }

                                // マッチしたら入れるもの
                                if (match) {
                                    result.push(
                                        `<tr>
                                                <td>${code[0]}</td>
                                                <td>${code[4]}</td>
                                                <td>${code[5]}</td>
                                                <td>${code[6]}</td>
                                                <td id="furigana">${code[3]}</td>
                                            </tr>`
                                    );
                                }// if(match)閉じ
                            });//each閉じ
                        }

                    $("table").css("display", "table");//表の表示

                    // 検索結果がなかった場合
                    if (result.length > 0) {//result.length>0：結果が1件以上あったとき
                                $("#tbody_search").html(result.join(""));
                        } else {
                            $("#tbody_search").html(
                                    `<tr id="not_found">
                                        <td colspan="5">検索結果はありません</td>
                                    </tr>`
                                );
                        }
                }//success閉じ
        });//ajax閉じ
    });//btn_all閉じ
           
    //---------------地図---------------------------    
    $("#tbody_search").on("click", "tr", function(){
        const pref = $(this).find("td").eq(1).text();
        const city = $(this).find("td").eq(2).text();
        const town = $(this).find("td").eq(3).text();
        //eq():jqueryのメソッド。要素のリストの中から、指定した番号の要素を取り出す
        const address = pref + city  + town;

        const mapURL = `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;

        $("#map_iframe").attr("src", mapURL);
        $("#map_area").show();

        //画面スクロール
        $("html, body").animate({
            scrollTop: $("#map_area").offset().top - 50
        }, 500);//500ms
        //scrollTop:スクロールさせるプロパティ　offset:要素のページ上を取得するメソッド
    });

    //---------------半角数字の制限---------------------------
    $("#post_code").on("input", function () {
        //ここのinputはHTMLのinput type=text
        this.value = this.value.replace(/[^0-9]/g, ``);
        //このthisは、HTML要素自体のこと
    });

    //---------------条件クリアボタン---------------------------
    $("#btn_clear").on("click",function(){
        $("#pref_sel").val("");
        $("#post_code").val("");
        $("#search_keyword").val("");
        $("input[name='mode'][value='AND']").prop("checked", true);
        // prop
        //　なんで２つ書くかを確認する
        $("#tbody_search").empty();
        // empty:指定した要素の中にある子要素を空にするメソッド
        //テーブルを消している
        $("table").css("display", "none");
        $("#post_code, #search_keyword").prop("disabled", true);

        $("#map_area").hide();
        $("#map_iframe").attr("src", "");
    });

    //--------------------入力制限-------------------------------------
    $("#pref_sel").on("change",function(){
        if ($(this).val() === "") {
            $("#post_code, #search_keyword").prop("disabled", true);
            // prop:プロパティの値の取得、設定をするメソッド
            //都道府県未選択であれば、disabled(無効化)するという設定をする
        } else {
            $("#post_code, #search_keyword").prop("disabled", false);
        }
    });

});//$(function)閉じ

const button = document.querySelector('.page-top');

button.addEventListener('click', () => {
  window.scroll({ 
    top: 0, 
    behavior: "smooth"
  });
});

window.addEventListener('scroll', () => {
  if(window.scrollY > 100){
    button.classList.add('is-active');
  }else{
    button.classList.remove('is-active');
  }
});