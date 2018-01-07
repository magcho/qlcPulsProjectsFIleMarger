// デバッグ用にグローバル空間におく
let domA;
let domB;
let mergedDom;
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

  funcDataA = domA.querySelectorAll("Engine > Function");
  funcDataB = domB.querySelectorAll("Engine > Function");

  const funcCountA = domA.querySelectorAll("Engine > Function").length;
  const funcCountB = domB.querySelectorAll("Engine > Function").length;

  // domAにdomBを追加するイメージ(domAはそのままいじらない)
  // バイアスはfuncCountA

  // Showの孫ノード
  let len = domB.querySelectorAll('Engine > Function > Track > ShowFunction').length;
  for (let i = 0; i < len; i++){
    domB.querySelectorAll('Engine > Function > Track > ShowFunction').item(i).setAttribute('ID', Number(domB.querySelectorAll('Engine > Function > Track > ShowFunction').item(i).getAttribute("ID"))+ funcCountA)
  }


  for (let i = 0; i < funcCountB;i++){
    funcDataB.item(i).setAttribute("ID", Number(funcDataB.item(i).getAttribute("ID"))+ funcCountA);

    switch (funcDataB.item(i).getAttribute("Type")) {
      case 'Chaser':
      case 'Collection':
        const stepCount = funcDataB.item(i).getElementsByTagName("Step").length;
        for(let j = 0; j < stepCount; j++){
          funcDataB.item(i).getElementsByTagName("Step").item(j).textContent = Number(funcDataB.item(i).getElementsByTagName("Step").item(j).textContent) + funcCountA;
        }
        break;

      case 'Sequence':
        funcDataB.item(i).setAttribute("BoundScene", Number(funcDataB.item(i).getAttribute("BoundScene"))+ funcCountA);
        break;

      case 'Script':
        const cmdCount = funcDataB.item(i).getElementsByTagName("Command").length;
        for(let j = 0; j < cmdCount; j++){
          let textContent = funcDataB.item(i).getElementsByTagName("Command").item(j).textContent;
          let tmp = {};
          if(textContent.indexOf("startfunction") === 0){
            tmp = ["startfunction%3A",funcDataB.item(i).getElementsByTagName("Command").item(j).textContent = Number(textContent.slice(textContent.indexOf('%3A')+3,textContent.length-10)) + funcCountA];
          }else if (textContent.indexOf("stopfunction") === 0) {
            tmp = ["stopfunction%3A",funcDataB.item(i).getElementsByTagName("Command").item(j).textContent = Number(textContent.slice(textContent.indexOf('%3A')+3,textContent.length-10)) + funcCountA];
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
