//イベント登録処理
function eventsRegister(){
    $(function($){
        $(".filter_player select").on("change", onFilterChange);
        $(".filter_time select").on("change", onFilterChange);
        $(".filter_tag input").on("change", onFilterChange);
    });
}

//Googleスプレッドシートからデータを取得する
function getSpreadData(){
    const READ_SHEET_NAME = "DataList";
    const MAX_ROW = 10000;
    const START_ROW = 0;
    const store = new SteinStore("https://api.steinhq.com/v1/storages/5f43a0655d3cdc44fcd7d382");
    store.read(READ_SHEET_NAME, {limit: MAX_ROW, offset: START_ROW}).then(data => {
        //デバッグ用データ内容表示
        console.log(" - - - - - - - - - - - AllData");
        console.dir(data);
        //文字列を対象のデータ型に直す
        for(i = 0; i < data.length; i++){
            data[i].Name_Base = data[i].Name_Base + "[" + data[i].Name_Version_Expansion + "]";
            data[i].Players_Min = parseInt(data[i].Players_Min,10);
            data[i].PlayingTime_Min = parseInt(data[i].PlayingTime_Min,10);
            data[i].PlayingTime_Max = parseInt(data[i].PlayingTime_Max,10);
            data[i].Tags = String(data[i].Tags).split(';');
            if(data[i].Image == null){
                data[i].Image = "image/NoImage.png"
            };
        }
        //ローカルにデータをJSON形式で保存する
        localStorage.setItem('json', JSON.stringify(data));
        makeTable(data)
    });
}

function makeTable(tableData){
    var table = new Tabulator("#result-table", {
        data:tableData,
        layout:"fitColumns",
        resizableColumns:false,
        columns:[
            {title:"画像", field:"Image", formatter:"image", formatterParams:{
                height:"100px",
                width:"100px",
            }},
            {title:"名前", field:"Name_Base"},
            {title:"人数", field:"Players_Min"},
            {title:"時間", field:"PlayingTime_Min", hozAlign:"right"},
            {title:"タグ", field:"Tags"},
            {title:"備考", field:"Remarks"}
        ],
    });
}

//フィルターエリアの変更を検知し実行される
function onFilterChange(){
    var filterFncs = [];
    var result = [];
    var allList = JSON.parse(localStorage.getItem('json'));

    //Playerフィルタの追加
    filterFncs.push(
        function(list){
            return filterByPlayer(list, $('.filter_player select').val());
        }
    );
    //Timeフィルタの追加
    filterFncs.push(
        function(list){
            return filterByPlayer(list, $('.filter_time select').val());
        }
    );
    //Tagフィルタの追加
    filterFncs.push(
        function(list) {
            return filterByTag(list, $('.filter_tag input:checked'));
        }
    );

    //全件リストをフィルタリングした結果を出力
    result = filterFncs.reduce(function(list, fnc){
        return fnc(list);
    }, allList);

    //デバッグ用データ内容表示
    console.log(" - - - - - - - - - - - FilterData");
    console.dir(result); 

    makeTable(result)
}

//Playerフィルタ
function filterByPlayer(list, value){
    if(value == ""){
        return list;
    }

    return list.filter(function(item){
        switch(value){
            case '1':
                return item.Players_Min == 1;
            case '2':
                return 1 < item.Players_Min;
        }
    });
}
//Timeフィルタ
function filterByPlayer(list, value){
    if(value == ""){
        return list;
    }

    return list.filter(function(item){
        if(isNAN(item.PlayingTime_Min)){
            item.PlayingTime_Min = null;
        }
        switch(value){
            case 'short': //20分以下すべて
                return item.PlayingTime_Min > 0 && item.PlayingTime_Max <= 20;
            case 'nomal': //21分～40分以内
                return item.PlayingTime_Min >= 20 && nvl(item.PlayingTime_Max, item.PlayingTime_Min) <= 40;
        }
    });
}
//Tagフィルタ
function filterByTag(list, value){
    if(value.length == 0){
        return list;
    }

    return list.filter(function(item){
        var isMatch = false;
        Array.from(value).forEach(function(chkItem, i) {
            item.Tags.forEach(function(tagItem, i) {
                if (tagItem === $(chkItem).val()) {
                    isMatch = true;
                }
            });
        });
        return isMatch;
    });
}

//最初に実行される
eventsRegister();
//読み込み完了時に実行される
window.onload = function(){
    getSpreadData()
};