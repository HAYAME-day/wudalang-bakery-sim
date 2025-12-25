//菜谱显示渲染
function renderRecipeBook() {//拿着id去查中文名(info.name)
  let html = "<table><tr><th>序号</th><th>菜名</th><th>所需材料/提示</th><th>售卖</th></tr>";
  recipes.forEach((r, i) => {
    let name = r.unlocked ? r.name : "？";
    let materialText;
    if (r.unlocked) {
      materialText = Object.entries(r.recipe).map(([id, cnt]) => {
        const info = getMaterialInfo(id);
        return `${getMaterialIconHtml(id)}${info.name}*${cnt}`;
      }).join("、");
    } else if (r.unlockType === 'favor' && favors.find(f => f.name === r.unlockFavor.char).value < r.unlockFavor.value) {
      materialText = r.hint; // 需要好感达到要求
    } else {
      materialText = r.hint; // 研发提示
    }
    let btnHtml = " ";
    if (r.unlocked) {
      btnHtml = `<button onclick="selectRecipe('${r.id}')" ${selectedRecipeId === r.id ? 'style="background:#d4dcd4;"' : ""}>${selectedRecipeId === r.id ? "已选" : "选择"}</button>`;
    }
    html += `<tr><td>${i+1}</td><td>${name}</td><td>${materialText}</td><td>${btnHtml}</td></tr>`;
  });
  html += "</table>";
  document.getElementById('tab-content-recipes').innerHTML = html;
}
