// デバッグ用にグローバル空間におく
let domA;
let domB;
let mergedDom;
let dataNameA = 'dataNmaeA';
let dataNameB = 'dataNmaeB';
function putText(v){
  document.getElementById("text").value += "\n" + v;
}


/**
 * Inputにファイルが追加されたら発火する関数
 * @method read
 * @param  {FILE} e FILE API向け
 * @param  {String} F A or B
 */
function read(e,F) {
  if (!e.files.length) return;

  const file = e.files[0];

  const fr = new FileReader();
  fr.onload = () => {
    text = fr.result; // 読み込み結果をtextareaに
    if(F === 'A') domA = perseXML(text);
    if(F === 'B') domB = perseXML(text);

    if(domA !== undefined && domB !== undefined){
      if(!checkFixture(domA,domB))console.log('２つのファイルのフィクスチャーが一致しません。マージに失敗しました。');
      mergedDom = mergeDom(domA,domB);

      // http://www.openspc2.org/reibun/javascript2/XML/convert/0002/index.html
      let xs = new XMLSerializer();
      let xmlText =  xs.serializeToString(mergedDom);

      // http://kurukurupapa.hatenablog.com/entry/20121006/1349522062
      let blob = new Blob([ xmlText ], { "type" : "text/xml" });
      window.URL = window.URL || window.webkitURL;
      document.getElementById('download').setAttribute('download', "merged.qxw");
      document.getElementById('download').setAttribute('href', window.URL.createObjectURL(blob));
    }

  }
  fr.readAsText(file); // ファイルをテキストとして読み込む

}
/**
 * テキストのxmlをDOMにパース
 * @method perseXML
 * @param  {string} text fileから取ってきたテキスト
 * @return {objects}      DOM操作可能なオブジェクト
 */
function perseXML(text){
  if (window.DOMParser) {
    const dp = new DOMParser();
    return XML = dp.parseFromString(text, "text/xml");
  } else {
    // code for old IE browsers
    xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
    xmlDoc.async = false;
    return xmlDoc.loadXML(text);
  }
}


/**
 * フィクスチャーが一致すればtrue,異なればfalse
 * @method checkFixture
 * @param  {XML_DOM}     domA [description]
 * @param  {DMX_DOM}     domB [description]
 * @return {bool}          [description]
 */
function checkFixture(domA,domB){
  if(domA === undefined || domB === undefined) return false;
  const fixtureDataA = domA.querySelectorAll("Engine > Fixture");
  const fixtureDataB = domB.querySelectorAll("Engine > Fixture");
  // フィクスチャー登録数チェック
  if(fixtureDataA.length !== fixtureDataB.length) return false;

  let nameFlag = false;
  const n = fixtureDataA.length;
  for (let i = 0; i < n; i++){
    const m = fixtureDataA.item(i).childElementCount;
    for (let j = 0; j < m; j++){
      if(fixtureDataA.item(i).children[j].tagName !== fixtureDataB.item(i).children[j].tagName && fixtureDataA.item(i).children[j].textContent !== fixtureDataB.item(i).children[j].textContent){
        if(fixtureDataA.item(i).children[j].tagName !== "Name"){ // 名前だけは違ってもいいや
          return false;
        }
        console.log('フィクスチャーにつけた名前が異なるものがあります');
      }
    }
  }
  return true;
}

/**
 * ２つのXMLのDOMからファンクションをマージし、DOMを返す
 * @method mergeDom
 * @param  {XML_DOM} domA [description]
 * @param  {XML_DOM} domB [description]
 * @return {XML_DOM}      [description]
 */
function mergeDom(domA, domB){
  if(domA === undefined || domB === undefined) return false;

  // ファンクションをフォルダに内包
  domA = intoFolder(domA, dataNameA);
  domB = intoFolder(domB, dataNameB);

  funcDataA = domA.querySelectorAll("Engine > Function");
  funcDataB = domB.querySelectorAll("Engine > Function");

  // データに内包しているファンクション数
  const funcCountA = domA.querySelectorAll("Engine > Function").length;
  const funcCountB = domB.querySelectorAll("Engine > Function").length;

  // domAにdomBを追加するイメージ(domAはそのままいじらない)
  // バイアスはdomAの最後のfunctionID、ファンクション削除してもNoの連番は振り直しにならないので、最後のノードに当てられたNo.を取得する必要がある
  if (domA.querySelector("Engine").lastElementChild.tagName == "Monitor"){
    domA.querySelector("Engine").lastElementChild.remove();
    // Monitorを設定している場合はマージには必要ないので削除
  }
  let bias = Number(domA.querySelector("Engine").lastElementChild.getAttribute('ID')) + 1;

  // Showの孫ノード
  let len = domB.querySelectorAll('Engine > Function > Track > ShowFunction').length;
  for (let i = 0; i < len; i++){
    domB.querySelectorAll('Engine > Function > Track > ShowFunction').item(i).setAttribute('ID', Number(domB.querySelectorAll('Engine > Function > Track > ShowFunction').item(i).getAttribute("ID"))+ bias)
  }
  len = domB.querySelectorAll('Engine > Function > Track').length;
  for (let i = 0; i < len; i++){
    if(domB.querySelectorAll('Engine > Function > Track').item(i).getAttribute('SceneID') !== null){
      domB.querySelectorAll('Engine > Function > Track').item(i).setAttribute('SceneID', Number(domB.querySelectorAll('Engine > Function > Track').item(i).getAttribute("SceneID"))+ bias)
    }
  }


  for (let i = 0; i < funcCountB;i++){
    // 共通
    funcDataB.item(i).setAttribute("ID", Number(funcDataB.item(i).getAttribute("ID"))+ bias);

    switch (funcDataB.item(i).getAttribute("Type")) {
      case 'Chaser':
      case 'Collection':
        const stepCount = funcDataB.item(i).getElementsByTagName("Step").length;
        for(let j = 0; j < stepCount; j++){
          funcDataB.item(i).getElementsByTagName("Step").item(j).textContent = Number(funcDataB.item(i).getElementsByTagName("Step").item(j).textContent) + bias;
        }
        break;

      case 'Sequence':
        funcDataB.item(i).setAttribute("BoundScene", Number(funcDataB.item(i).getAttribute("BoundScene"))+ bias);
        break;

      case 'Script':
        const cmdCount = funcDataB.item(i).getElementsByTagName("Command").length;
        for(let j = 0; j < cmdCount; j++){
          let textContent = funcDataB.item(i).getElementsByTagName("Command").item(j).textContent;
          let tmp = {};
          if(textContent.indexOf("startfunction") === 0){
            tmp = ["startfunction%3A",funcDataB.item(i).getElementsByTagName("Command").item(j).textContent = Number(textContent.slice(textContent.indexOf('%3A')+3,textContent.length-10)) + bias];
          }else if (textContent.indexOf("stopfunction") === 0) {
            tmp = ["stopfunction%3A",funcDataB.item(i).getElementsByTagName("Command").item(j).textContent = Number(textContent.slice(textContent.indexOf('%3A')+3,textContent.length-10)) + bias];
          }
          funcDataB.item(i).getElementsByTagName("Command").item(j).textContent = tmp.join('');
        }
        break;

      default:
    }

    // ファイルのマージ
    domA.querySelector('Engine').appendChild(funcDataB.item(i));
  }
  return domA;
}


/**
 * dom内のファンクションをQLCのフォルダに内包する
 * @method intoFolder
 * @param  {XML_DOM}   dom        [description]
 * @param  {String}   folderName [description]
 * @return {XML_DOM}              [description]
 */
function intoFolder(dom,folderName){
  const funcNum = dom.querySelectorAll("Engine > Function").length;
  for (let i = 0;i < funcNum; i++){
    if(dom.querySelectorAll('Engine > Function').item(i).getAttribute("Path") !== null){
      // フォルダに内包されている
      dom.querySelectorAll('Engine > Function').item(i).setAttribute("Path", folderName + "/" + dom.querySelectorAll('Engine > Function').item(i).getAttribute("Path"));
    }else{
      // フォルダに属さない
      dom.querySelectorAll('Engine > Function').item(i).setAttribute("Path", folderName);
    }
  }
  return dom;
}


function listShow_e(){
  let tmp = listShow(domA);
  for (index in tmp){
    document.getElementById('text').textContent = document.getElementById('text').textContent + tmp[index].name +':'+tmp[index].id +"\n";
  }
}
/**
 * Showファンクションの一覧を表示する
 * @method listShow
 * @param  {[type]} dom [description]
 * @return {[type]}     [description]
 */
function listShow(dom){
  let out = [];
  let arr = dom.querySelectorAll('Engine > Function[Type="Show"]');
  const N = dom.querySelectorAll('Engine > Function[Type="Show"]').length;
  for(let i = 0;i < N;i++){
    out[i] = {
      'name': arr.item(i).getAttribute('Name'),
      'id': arr.item(i).getAttribute('ID')
    }
  }
  return out;
}


function testFixture(){
  if(checkFixture(domA,domB)){
    window.alert('fixture OK ');
  }else{
    window.alert('fixture No');
  }
}


/**
 * データ内の２つのショーデータを１つに結合します。
 * 同じデータ内のショーであることが前提
 * @method mergeShow
 * @param  {int}  first  結合されるFunction No.
 * @param  {int}  second 連結するFunction No.
 * @param {string} nameAdd追記する名前
 * @return {XML_DOM, false}         引数が不正な場合はfalse
 */
function mergeShow(first,second, nameAdd){
  let dom = domA;
  const BLANK_TIME = 1000; //1s
  // 有効性チェック
  if(dom.querySelectorAll('Engine > Function[ID="'+first+'"]').item(0).getAttribute('Type') !== 'Show'){
    console.warn('mergeShow()に渡された引数{first}が不正です');
    return false;
  }
  if(dom.querySelectorAll('Engine > Function[ID="'+second+'"]').item(0).getAttribute('Type') !== 'Show'){
    console.warn('mergeShow()に渡された引数{second}が不正です');
    return false;
  }

  // 秒数バイアスの決定
  let timeBias = 0;
  let N = dom.querySelectorAll('Engine > Function[ID="'+first+'"] > Track > ShowFunction').length;
  for (let i = 0;i < N;i++){
    num =  Number(dom.querySelectorAll('Engine > Function[ID="'+first+'"]').item(0).getElementsByTagName('ShowFunction').item(i).getAttribute('StartTime')) + Number(dom.querySelectorAll('Engine > Function[ID="'+first+'"]').item(0).getElementsByTagName('ShowFunction').item(i).getAttribute('Duration'));
    if(num > timeBias){
      timeBias = Number(dom.querySelectorAll('Engine > Function[ID="'+first+'"]').item(0).getElementsByTagName('ShowFunction').item(i).getAttribute('StartTime')) + Number(dom.querySelectorAll('Engine > Function[ID="'+first+'"]').item(0).getElementsByTagName('ShowFunction').item(i).getAttribute('Duration'));
    }
  }
  timeBias += BLANK_TIME;
  // 値のシフト
  N = dom.querySelectorAll('Engine > Function[ID="'+second+'"] > Track > ShowFunction').length;
  for (let i = 0; i < N;i++){
    dom.querySelectorAll('Engine > Function[ID="'+second+'"] > Track > ShowFunction').item(i).setAttribute('StartTime', Number(dom.querySelectorAll('Engine > Function[ID="'+second+'"] > Track > ShowFunction').item(i).getAttribute('StartTime')) + timeBias);
  }

  // Track ID bias
  let idBias = 0;
  N = dom.querySelectorAll('Engine > Function[ID="'+first+'"] >Track').length;
  for(let i = 0;i < N;i++){
    if(dom.querySelectorAll('Engine > Function[ID="'+first+'"] > Track').item(i).getAttribute('ID') > idBias){
      idBias = Number(dom.querySelectorAll('Engine > Function[ID="'+first+'"] > Track').item(i).getAttribute('ID'));
    }
  }
  idBias += 1;
 // 値のシフト
  N = dom.querySelectorAll('Engine > Function[ID="'+second+'"] > Track').length;
  for(let i = 0;i < N;i++){
    // idシフト
    dom.querySelectorAll('Engine > Function[ID="'+second+'"] > Track').item(i).setAttribute('ID', Number(dom.querySelectorAll('Engine > Function[ID="'+second+'"] > Track').item(i).getAttribute('ID')) + idBias);
    // 名前追記
    dom.querySelectorAll('Engine > Function[ID="'+second+'"] > Track').item(i).setAttribute('Name', nameAdd + dom.querySelectorAll('Engine > Function[ID="'+second+'"] > Track').item(i).getAttribute('Name'));
  }


  // 結合
  // first に指定したShowに追記
  N = dom.querySelectorAll('Engine > Function[ID="'+second+'"] >Track').length;
  let temp = dom.querySelectorAll('Engine > Function[ID="'+second+'"] > Track');
  for(let i = 0; i< N;i++){
    dom.querySelector('Engine > Function[ID="'+first+'"]').appendChild(temp.item(i));
  }


  domA = dom
}


/**
 * ダウンロード用blobを生成する
 * @method createFile
 * @param  {XML_DOM}   dom [description]
 */
function createFile(dom){
  // http://www.openspc2.org/reibun/javascript2/XML/convert/0002/index.html
  let xs = new XMLSerializer();
  let xmlText =  xs.serializeToString(dom);

  // http://kurukurupapa.hatenablog.com/entry/20121006/1349522062
  let blob = new Blob([ xmlText ], { "type" : "text/xml" });
  window.URL = window.URL || window.webkitURL;
  document.getElementById('download').setAttribute('download', "merged.qxw");
  document.getElementById('download').setAttribute('href', window.URL.createObjectURL(blob));
}


/**
 * ショーデータをずらす
 * @method shiftShow
 * @param {int}  id Functoin ID
 * @param  {int}  ms [description]
 */
function shiftShow(id,ms){
  let N = domA.querySelectorAll('Engine > Function[ID="'+id+'"] > Track > ShowFunction').length;
  for (let i = 0; i < N;i++){
    domA.querySelectorAll('Engine > Function[ID="'+id+'"] > Track > ShowFunction').item(i).setAttribute('StartTime', Number(domA.querySelectorAll('Engine > Function[ID="'+id+'"] > Track > ShowFunction').item(i).getAttribute('StartTime')) + ms);
  }
}
