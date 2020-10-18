//イベント登録処理
function eventsRegister(){
    $(function($){
        $(".filter_player input").on("change", onFilterChange);
        $(".filter_time select").on("change", onFilterChange);
        $(".filter_tag_radio input").on("change", onFilterChange);
        $(".filter_rate select").on("change", onFilterChange);
        //$(".filter_tag_box input").on("change", onFilterChange);
        $(".filter_owner select").on("change", onFilterChange);
        $(".filter_genre select").on("change", onFilterChange);
        $(".filter_coop_multi select").on("change", onFilterChange);
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
        var owner = {NoOwner:"指定なし"};
        var genre = {0:"指定なし"};
        for(i = 0; i < data.length; i++){
            //Name
            var name_VerOrExp = (data[i].Name_Version_Expansion === null)?"":"[" + data[i].Name_Version_Expansion + "]";
            data[i].Name_Base = data[i].Name_Base + name_VerOrExp;
            //Player
            data[i].Players_Min = parseInt(data[i].Players_Min,10);
            data[i].Players_Max = parseInt(data[i].Players_Max,10);
            data[i].Players_OnlyFlag = (data[i].Players_OnlyFlag === 'TRUE');
            data[i].Players = formatPlayers(data[i]);
            //Time
            data[i].PlayingTime_Min = parseInt(data[i].PlayingTime_Min,10);
            data[i].PlayingTime_Max = parseInt(data[i].PlayingTime_Max,10);
            data[i].PlayingTime = formatPlayingTime(data[i]);
            //Tag
            data[i].Tags = String(data[i].Tags === null ?"":data[i].Tags).split(';');
            //Image
            data[i].Image = (data[i].Image === null)?"image/NoImage.png":data[i].Image;
            //Owner
            owner[data[i].Owner] = data[i].Owner;
            //Rating
            data[i].Rating = (data[i].Rating === null)?0:parseInt(data[i].Rating,10);
            //Genre
            if (data[i].Genre != null) {
                dict = createKVP(data[i].Genre, ";");
                genre[Object.keys(dict)[0]] = dict[Object.keys(dict)[0]];
            }
        }
        //所有者のセレクトボックスを作成
        createSelectBox("sel_owner", owner)
        //ジャンルのセレクトボックスを作成
        createSelectBox("sel_genre", genre)
        //ローカルにデータをJSON形式で保存する
        localStorage.setItem('json', JSON.stringify(data));
        makeTable(data)
    });
}

//Playerのテキスト表示フォーマット
function formatPlayers(data) {
    var ret = "" + (isNaN(data.Players_Min) ? "" : data.Players_Min);
    if(data.Players_Min !== data.Players_Max) {
        ret += (data.Players_OnlyFlag ? ", " : " - ") + (isNaN(data.Players_Max) ? "" : data.Players_Max);
    }

    return ret;
}

//Timeのテキスト表示フォーマット
function formatPlayingTime(data) {
    var ret = "";
    if(!isNaN(data.PlayingTime_Min)) {
        ret += data.PlayingTime_Min;
    }
    if(data.PlayingTime_Min !== data.PlayingTime_Max) {
        ret += " - ";
        if(!isNaN(data.PlayingTime_Max)) {
            ret += data.PlayingTime_Max;
        }
    }

    return ret;
}

//セレクトボックスを動的に作成する
function createSelectBox(selBoxId, dict){
    var keys = Object.keys(dict)
    for(var i=0;i<keys.length;i++){
        let op = document.createElement("option");
        op.value = keys[i];         //value値
        op.text = dict[keys[i]];    //テキスト値
        document.getElementById(selBoxId).appendChild(op);
    }
}

//区切り文字で分けられた文字列の、最初の２項目をKeyとValueに変換する
function createKVP(strArg, separator){
    var dict = {}
    if(String(strArg).match("^[0-9]{1,};.{1,}$") === null) {
        return null
    }
    var str = String(strArg).split(separator)
    dict[str[0]] = str[1]
    return dict
}

function makeTable(tableData){
    var table = new Tabulator("#result-table", {
        data:tableData,
        layout:"fitColumns",
        resizableColumns:false,
        columns:[
            {title:"画像", field:"Image", formatter:"image", hozAlign:"center",
             formatterParams:{
                height:"100px",
                width:"100px",},
             width:120},
            {title:"名前", field:"Name_Base", formatter:"textarea"},
            {title:"人数", field:"Players", width:100},
            {title:"時間", field:"PlayingTime", width:100},
            {title:"評価", field:"Rating", formatter:"star", hozAlign:"center", width:100},
            //{title:"タグ", field:"Tags", formatter:"textarea"},
            //{title:"備考", field:"Remarks", formatter:"textarea"},
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
            return filterByPlayer(list, $('.filter_player input').val());
        }
    );
    //Timeフィルタの追加
    filterFncs.push(
        function(list){
            return filterByPlayingTime(list, $('.filter_time select').val());
        }
    );
    //Rateフィルタの追加
    filterFncs.push(
        function(list){
            return filterByRate(list, $('.filter_rate select').val());
        }
    );
    //Tagフィルタの追加
    /*filterFncs.push(
        function(list) {
            return filterByTag(list, $('.filter_tag_radio input:checked').val(), $('.filter_tag_box input:checked'));
        }
    );*/
    //Ownerフィルタの追加
    filterFncs.push(
        function(list){
            return filterByOwner(list, $('.filter_owner select').val());
        }
    );
    //Genreフィルタの追加
    filterFncs.push(
        function(list){
            return filterByGenre(list, $('.filter_genre select').val());
        }
    );
    //Coop_Multiフィルタの追加
    filterFncs.push(
        function(list){
            return filterByCoopMulti(list, $('.filter_coop_multi select').val());
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

    const MOST_LESS_PLAYER = 0;
    const MOST_MANY_PLAYER = 10000;

    var players = parseInt(value, 10);
    return list.filter(function(item){
        var filterPlayerMin = (item.Players_Min === null?MOST_LESS_PLAYER:item.Players_Min);
        var filterPlayerMax = (item.Players_Max === null?MOST_MANY_PLAYER:item.Players_Max);
        if(item.Players_OnlyFlag) {
            return filterPlayerMin === players || filterPlayerMax === players;
        } else {
            return filterPlayerMin <= players && filterPlayerMax >= players;
        }
    });
}
//Timeフィルタ
function filterByPlayingTime(list, value){
    if(value == ""){
        return list;
    }

    const MOST_SHORT_TIME = 0;
    const MOST_LONG_TIME = 10000;

    var filterTimeMin, filterTimeMax;
    switch(value){
        case 'short': //20分以下
            filterTimeMin = MOST_SHORT_TIME;
            filterTimeMax = 20;
            break;
        case 'nomal': //21分～40分以内
            filterTimeMin = 21;
            filterTimeMax = 40;
            break;
        case 'long': //41分～60分以内
            filterTimeMin = 41;
            filterTimeMax = 60;
            break;
        case 'very_long': //61分以上
            filterTimeMin = 61;
            filterTimeMax = MOST_LONG_TIME;
            break;
    }

    return list.filter(function(item){
        var playingTimeMin = (item.PlayingTime_Min === null)?MOST_SHORT_TIME:item.PlayingTime_Min;
        var playingTimeMax = (item.PlayingTime_Max === null)?MOST_LONG_TIME:item.PlayingTime_Max;

        return filterTimeMin <= playingTimeMax && filterTimeMax > playingTimeMin;
    });
}
//Rateフィルタ
function filterByRate(list, value){
    if(value == ""){
        return list;
    }

    var rate = parseInt(value, 10);
    return list.filter(function(item){
        return item.Rating === rate;
    });
}
//Tagフィルタ
function filterByTag(list, value_radio, value_box){
    if(value_box.length == 0){
        return list;
    }

    return list.filter(function(item){
        var isMatch = false;
        var matchCnt = 0;
        Array.from(value_box).forEach(function(chkItem, i) {
            item.Tags.forEach(function(tagItem, i) {
                if (tagItem === $(chkItem).val()) {
                    //OR検索の場合は1つでも一致すればOK
                    isMatch = true;
                    if (value_radio === "tag_and") {
                        matchCnt += 1
                        //AND検索の場合は全て一致した場合のみOK
                        isMatch = (matchCnt === value_box.length)    
                    }
                }
            });
        });
        return isMatch;
    });
}
//Ownerフィルタ
function filterByOwner(list, value){
    if(value == "NoOwner"){
        return list;
    }

    return list.filter(function(item){
        return item.Owner === value;
    });
}
//Genreフィルタ
function filterByGenre(list, value){
    if(value == 0){
        return list;
    }

    return list.filter(function(item){
        var dict = createKVP(item.Genre, ";");
        if(dict === null){
            return false
        }
        return Object.keys(dict)[0] === value;
    });
}
//Coop_Multiフィルタ
function filterByCoopMulti(list, value){
    if(value == ""){
        return list;
    }

    switch(value){
        case "multi":
            return list.filter(function(item){return RegExp('対戦').test(item.Coop_Multi)});
        case "coop":
            return list.filter(function(item){return RegExp('協力').test(item.Coop_Multi)});
        case "coop_multi":
            return list.filter(function(item){return RegExp('対戦').test(item.Coop_Multi) &&
                                                     RegExp('協力').test(item.Coop_Multi)});
    };
}

//最初に実行される
eventsRegister();
//読み込み完了時に実行される
window.onload = function(){
    getSpreadData()
};