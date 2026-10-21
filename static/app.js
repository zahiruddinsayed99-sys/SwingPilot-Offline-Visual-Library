const $ = s => document.querySelector(s);
let images = [], categories = [], currentView = "all", currentCategory = "", currentImageId = null, visibleIndex = 0, zoomed = false, chosenFiles = [];
const escapeHtml = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
async function api(url, options={}) {
  const r = await fetch(url, options); let data={}; try{data=await r.json()}catch{}
  if(!r.ok) throw new Error(data.error || `Request failed (${r.status})`); return data;
}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("show"),3300)}
function activeCategory(){return categories.find(c=>String(c.id)===String(currentCategory))}
async function refresh(){
  try{
    const params=new URLSearchParams(); const q=$("#searchInput").value.trim(); if(q)params.set("q",q);
    if(currentView==="favorites")params.set("favorites","1"); if(currentCategory)params.set("category",currentCategory);
    const data=await api("/api/library?"+params); images=data.images; categories=data.categories;
    renderCategories(); renderGallery(); updateCounts();
  }catch(e){toast("Could not load library: "+e.message)}
}
function renderCategories(){
  const nav=$("#categoryNav");
  nav.innerHTML=categories.map(c=>`<div class="category-link ${String(c.id)===String(currentCategory)?"active":""}" data-cat="${c.id}"><span>▰</span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(c.name)}</span><span class="count">${c.image_count||0}</span></div>`).join("");
  nav.querySelectorAll("[data-cat]").forEach(el=>el.onclick=()=>{currentCategory=el.dataset.cat;currentView="category";updateNav();refresh()});
  const options='<option value="">Uncategorized</option>'+categories.map(c=>`<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
  $("#editCategory").innerHTML=options; $("#importCategory").innerHTML='<option value="">Choose category after import</option>'+categories.map(c=>`<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
}
function updateNav(){
  document.querySelectorAll(".nav-item[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===currentView&&!currentCategory));
  $("#pageTitle").textContent=currentCategory?(activeCategory()?.name||"Category"):currentView==="favorites"?"Favorites":"All visuals";
  $("#sectionTitle").textContent=currentCategory?(activeCategory()?.name||"Category"):currentView==="favorites"?"Your favorites":"Browse library";
}
function updateCounts(){
  $("#allCount").textContent=categories.reduce((a,c)=>a+(c.image_count||0),0);
  $("#favCount").textContent=images.filter(i=>i.favorite).length;
  $("#resultCount").textContent=`${images.length} visual${images.length===1?"":"s"}`;
}
function renderGallery(){
  const gallery=$("#gallery"), empty=$("#emptyState"); const sort=$("#sortSelect").value;
  let list=[...images]; if(sort==="title")list.sort((a,b)=>a.title.localeCompare(b.title)); if(sort==="oldest")list.reverse();
  gallery.innerHTML=list.map((im,i)=>`<article class="image-card" data-id="${im.id}" tabindex="0" role="button" aria-label="Open ${escapeHtml(im.title)}">
    <div class="thumb"><img loading="lazy" src="${im.url}" alt="${escapeHtml(im.title)}"><button class="card-fav" data-fav="${im.id}" title="Toggle favorite">${im.favorite?"★":"☆"}</button></div>
    <div class="card-info"><div class="card-title" title="${escapeHtml(im.title)}">${escapeHtml(im.title||im.original_name)}</div><div class="card-meta">${escapeHtml(im.category||"Uncategorized")} · ${escapeHtml(im.original_name)}</div><div class="tag-row">${im.tags_list.slice(0,3).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join("")}</div></div></article>`).join("");
  gallery.querySelectorAll(".image-card").forEach(card=>{
    const open=()=>openViewer(Number(card.dataset.id)); card.onclick=e=>{if(e.target.closest("[data-fav]"))return;open()};card.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();open()}};
  });
  gallery.querySelectorAll("[data-fav]").forEach(b=>b.onclick=async e=>{e.stopPropagation();const im=images.find(x=>x.id===Number(b.dataset.fav));if(im){await patch(im.id,{favorite:!im.favorite});await refresh()}});
  empty.hidden=list.length!==0;gallery.hidden=list.length===0;
  if(!list.length){$("#emptyTitle").textContent=$("#searchInput").value?"No matching visuals":"Your visual library is ready";$("#emptyText").textContent=$("#searchInput").value?"Try another search term or clear filters.":"Import the images you have collected to begin building your offline playbook."}
}
function currentImage(){return images.find(i=>i.id===currentImageId)}
function openViewer(id){
  const im=images.find(i=>i.id===id);if(!im)return;currentImageId=id;visibleIndex=images.findIndex(i=>i.id===id);zoomed=false;
  $("#viewer").hidden=false;document.body.style.overflow="hidden";fillViewer(im);
}
function fillViewer(im){
  $("#viewerImage").src=im.url;$("#viewerImage").alt=im.title;$("#viewerImage").classList.remove("zoomed");zoomed=false;
  $("#viewerCounter").textContent=`${Math.max(visibleIndex+1,1)} / ${images.length} · ${im.original_name}`;
  $("#editTitle").value=im.title||"";$("#editDescription").value=im.description||"";$("#editTags").value=im.tags||"";$("#editCategory").value=im.category_id||"";
  $("#toggleFavorite").textContent=im.favorite?"★ Favorited":"☆ Favorite";
}
function closeViewer(){$("#viewer").hidden=true;document.body.style.overflow="";zoomed=false}
function stepViewer(dir){if(!images.length)return;visibleIndex=(visibleIndex+dir+images.length)%images.length;currentImageId=images[visibleIndex].id;fillViewer(images[visibleIndex])}
async function patch(id,data){return api(`/api/images/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)})}
function showModal(id){$(id).hidden=false}
function hideModal(id){$(id).hidden=true}
async function loadCategoryManager(){
  categories=await api("/api/categories");renderCategories();
  $("#categoryManager").innerHTML=categories.map(c=>`<div class="category-row" data-row="${c.id}"><span>${escapeHtml(c.name)} <small>(${c.image_count||0})</small></span><button data-rename="${c.id}">Rename</button><button class="delete-cat" data-delete="${c.id}">Delete</button></div>`).join("");
  // Category endpoint provides names; counts are refreshed from library response.
  const lib=await api("/api/library"); categories=lib.categories; renderCategories();
  $("#categoryManager").innerHTML=categories.map(c=>`<div class="category-row"><span>${escapeHtml(c.name)} <small>(${c.image_count||0})</small></span><button data-rename="${c.id}">Rename</button><button class="delete-cat" data-delete="${c.id}">Delete</button></div>`).join("");
  $("#categoryManager").querySelectorAll("[data-rename]").forEach(b=>b.onclick=async()=>{const c=categories.find(x=>x.id===Number(b.dataset.rename));const name=prompt("New category name:",c?.name||"");if(name===null)return;try{await api(`/api/categories/${b.dataset.rename}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({name})});toast("Category renamed");await loadCategoryManager();await refresh()}catch(e){toast(e.message)}});
  $("#categoryManager").querySelectorAll("[data-delete]").forEach(b=>b.onclick=async()=>{const c=categories.find(x=>x.id===Number(b.dataset.delete));if(!confirm(`Delete category "${c?.name}"? It must be empty.`))return;try{await api(`/api/categories/${b.dataset.delete}`,{method:"DELETE"});toast("Category deleted");if(currentCategory===b.dataset.delete)currentCategory="";await loadCategoryManager();await refresh()}catch(e){toast(e.message)}});
}
$("#importBtn").onclick=()=>{chosenFiles=[];$("#fileInput").value="";$("#selectedFiles").textContent="No files selected";$("#doImport").disabled=true;$("#importStatus").textContent="";showModal("#importModal")};
$("#emptyImport").onclick=()=>$("#importBtn").click();$("#chooseFiles").onclick=()=>$("#fileInput").click();
$("#fileInput").onchange=()=>{chosenFiles=[...$("#fileInput").files];$("#selectedFiles").textContent=`${chosenFiles.length} file(s) selected`;$("#doImport").disabled=!chosenFiles.length};
$("#doImport").onclick=async()=>{if(!chosenFiles.length)return;const fd=new FormData();chosenFiles.forEach(f=>fd.append("files",f));fd.append("category_id",$("#importCategory").value);$("#doImport").disabled=true;$("#importStatus").textContent="Importing…";try{const d=await api("/api/images",{method:"POST",body:fd});hideModal("#importModal");await refresh();toast(`Imported ${d.added}; skipped duplicates ${d.skipped.length}${d.errors.length?`; errors ${d.errors.length}`:""}`);if(d.errors.length)alert(d.errors.join("\n"))}catch(e){$("#importStatus").textContent=e.message;toast(e.message)}finally{$("#doImport").disabled=!chosenFiles.length}};
$("#saveDetails").onclick=async()=>{const im=currentImage();if(!im)return;try{await patch(im.id,{title:$("#editTitle").value,description:$("#editDescription").value,tags:$("#editTags").value,category_id:$("#editCategory").value,favorite:im.favorite});await refresh();const refreshed=currentImage();if(refreshed)fillViewer(refreshed);toast("Image details saved")}catch(e){toast(e.message)}};
$("#toggleFavorite").onclick=async()=>{const im=currentImage();if(!im)return;try{await patch(im.id,{favorite:!im.favorite});await refresh();const fresh=currentImage();if(fresh)fillViewer(fresh);toast("Favorite updated")}catch(e){toast(e.message)}};
$("#deleteImage").onclick=async()=>{const im=currentImage();if(!im||!confirm(`Remove "${im.title}" from this library? The original source image is not affected.`))return;try{await api(`/api/images/${im.id}`,{method:"DELETE"});closeViewer();await refresh();toast("Removed from library")}catch(e){toast(e.message)}};
$("#closeViewer").onclick=closeViewer;$("#prevImage").onclick=$("#viewerPrev").onclick=()=>stepViewer(-1);$("#nextImage").onclick=$("#viewerNext").onclick=()=>stepViewer(1);
$("#viewerImage").onclick=()=>{$("#viewerImage").classList.toggle("zoomed");zoomed=!zoomed;$("#zoomHint").textContent=zoomed?"Click image to return":"Click image to zoom"};
$("#searchInput").oninput=()=>{currentCategory="";updateNav();refresh()};$("#sortSelect").onchange=renderGallery;$("#clearFilters").onclick=()=>{$("#searchInput").value="";currentCategory="";currentView="all";updateNav();refresh()};
document.querySelectorAll(".nav-item[data-view]").forEach(b=>b.onclick=()=>{currentView=b.dataset.view;currentCategory="";updateNav();refresh()});
$("#themeToggle").onclick=()=>{document.body.classList.toggle("dark");localStorage.setItem("swingpilot-theme",document.body.classList.contains("dark")?"dark":"light");$("#themeToggle").textContent=document.body.classList.contains("dark")?"☾":"☼"};
if(localStorage.getItem("swingpilot-theme")==="dark")document.body.classList.add("dark");$("#themeToggle").textContent=document.body.classList.contains("dark")?"☾":"☼";
$("#addCategory").onclick=async()=>{const name=prompt("New category name:");if(name===null)return;try{await api("/api/categories",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name})});await refresh();toast("Category added")}catch(e){toast(e.message)}};
$("#manageCategories").onclick=async()=>{showModal("#categoryModal");await loadCategoryManager()};$("#createCategory").onclick=async()=>{const name=$("#newCategoryName").value.trim();if(!name)return toast("Enter a category name");try{await api("/api/categories",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name})});$("#newCategoryName").value="";await loadCategoryManager();await refresh();toast("Category added")}catch(e){toast(e.message)}};
document.querySelectorAll(".close-modal").forEach(b=>b.onclick=()=>hideModal("#categoryModal"));document.querySelectorAll(".close-import").forEach(b=>b.onclick=()=>hideModal("#importModal"));
$("#backupBtn").onclick=async()=>{try{const d=await api("/api/backup",{method:"POST"});toast(`Backup created: ${d.path}`);alert(`Backup created successfully:\n${d.path}\n\nCopy this ZIP somewhere safe for safekeeping.`)}catch(e){toast("Backup failed: "+e.message)}};
document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();$("#searchInput").focus()}if(e.key==="Escape"){closeViewer();hideModal("#categoryModal");hideModal("#importModal")}if(!$("#viewer").hidden&&e.key==="ArrowLeft")stepViewer(-1);if(!$("#viewer").hidden&&e.key==="ArrowRight")stepViewer(1)});
refresh();
