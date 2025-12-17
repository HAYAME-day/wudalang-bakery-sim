// 背包的具体交互
function renderMaterialBag() {
  const listHtml = Object.entries(materials).map(([name, num]) => {
    const emoji = materialTypes[name] || "❓";
    const gray = num > 0 ? "" : "style='opacity:0.45;'";//数量大于0就正常显示，=0就半透明
    return `<div ${gray}>${emoji} ${name} *${num}</div>`;
  }).join('');
  document.getElementById('tab-content-materials').innerHTML = listHtml;
}
