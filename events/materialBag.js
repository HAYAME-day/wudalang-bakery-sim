// 背包的具体交互
function renderMaterialBag() {
  const listHtml = Object.entries(materials).map(([id, count]) => {
    const info = getMaterialInfo(id);
    const grayStyle = count > 0 ? "" : "style='opacity:0.45;'";//数量大于0就正常显示，=0就半透明
    return `<div ${grayStyle}><img src="${info.img}" style="width:24px;vertical-align:middle;"> 
              ${info.name} * ${count}</div>`;
  }).join('');
  document.getElementById('tab-content-materials').innerHTML = listHtml;
}
