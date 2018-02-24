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

  const n = fixtureDataA.length;
  for (let i = 0; i < n; i++){
    const m = fixtureDataA.item(i).childElementCount;
    for (let j = 0; j < m; j++){
      if(fixtureDataA.item(i).children[j].tagName !== fixtureDataB.item(i).children[j].tagName && fixtureDataA.item(i).children[j].textContent !== fixtureDataB.item(i).children[j].textContent){
          return false;
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
