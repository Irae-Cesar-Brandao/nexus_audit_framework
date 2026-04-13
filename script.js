const KEY="auditoria_full";
let html=""; campos.forEach(c=>html+=blocoHTML(c)); document.getElementById("blocos").innerHTML=html;

function novo(){
 if(confirm("Iniciar nova análise?")){
  document.querySelectorAll('input, textarea').forEach(e=>e.value="");
  document.querySelectorAll('img').forEach(i=>i.src="");
 }
}

function imgLoad(e,id){let r=new FileReader();r.onload=()=>document.getElementById(id).src=r.result;r.readAsDataURL(e.target.files[0]);}

function coletar(){
let dados={empresa:empresa.value,email:email.value,telefone:telefone.value,endereco:endereco.value,cidade:cidade.value,estado:estado.value,cep:cep.value,responsavel:responsavel.value,setor:setor.value,data:data.value,revisao:revisao.value,correcoes:correcoes.value,auditor:auditor.value,cargo:cargo.value,blocos:[]};
campos.forEach(c=>{
 dados.blocos.push({nome:c,desc:document.getElementById('desc_'+c).value,nota:+document.getElementById('nota_'+c).value||0,img:document.getElementById('img_'+c).src||""});
});
return dados;
}

function listar(){
 let db = JSON.parse(localStorage.getItem(KEY)) || {};

 lista.innerHTML = "";
 listaRelatorios.innerHTML = "";

 Object.keys(db).forEach(n => {

  // dropdown
  let o = document.createElement("option");
  o.value = n;
  o.textContent = n;
  lista.appendChild(o);

  // tabela com checkbox padronizado
  listaRelatorios.innerHTML += `
  <tr>
    <td><input type="checkbox" class="checkRel" value="${n}"></td>
    <td>${n}</td>
    <td>
      <button onclick="carregarNome('${n}')">Editar</button>
    </td>
  </tr>`;
 });
}

function gerarPDFMultiplo(){
 const {jsPDF}=window.jspdf;
 let doc=new jsPDF();
 let db=JSON.parse(localStorage.getItem(KEY))||{};


let checks = document.querySelectorAll("#listaRelatorios input[type=checkbox]:checked");
if(checks.length === 0){
 alert("Selecione pelo menos um relatório!");
 return;
}



 let y=10;

 function add(t){
  let l=doc.splitTextToSize(t,180);
  l.forEach(x=>{
   if(y>280){doc.addPage();y=10}
   doc.text(x,10,y);
   y+=7;
  });
 }

 checks.forEach((c,i)=>{
  let d=db[c.value];

  if(i>0){doc.addPage(); y=10}

  add(`RELATÓRIO: ${c.value}`);
  add(`Empresa: ${d.empresa}`);
  add(`Email: ${d.email}`);
  add(`Telefone: ${d.telefone}`);
  add(`Endereço: ${d.endereco}`);
  add(`Cidade: ${d.cidade}`);
  add(`Estado: ${d.estado}`);
  add(`CEP: ${d.cep}`);
  add(`Responsável: ${d.responsavel}`);

  add(`Setor: ${d.setor}`);
  add(`Data: ${d.data}`);
  add(`Revisão: ${d.revisao}`);
  add(`Correções: ${d.correcoes}`);

  add(`Auditor: ${d.auditor} (${d.cargo})`);

  d.blocos.forEach(b=>{
    add(`\n${b.nome.toUpperCase()} - Nota: ${b.nota}`);
    add(b.desc);

    if(b.img){
      try{
        doc.addImage(b.img,'JPEG',10,y,50,30);
        y+=35;
      }catch(e){}
    }
  });

  let notas=d.blocos.map(b=>b.nota);
  add("\nParecer: "+gerarParecer(notas));
});


// ===== RANKING FINAL =====
let ranking=[];
Object.keys(db).forEach(n=>{
 let notas=(db[n].blocos||[]).map(b=>b.nota||0);
 let media=notas.reduce((a,b)=>a+b,0)/notas.length;
 let risco=10-media;
 ranking.push({n,media,risco});
});

ranking.sort((a,b)=>b.risco-a.risco);

doc.addPage();
y=10;
add("RANKING DE RISCO");

ranking.forEach((r,i)=>{
 add(`${i+1}º - ${r.n} | Média: ${r.media.toFixed(1)} | Risco: ${r.risco.toFixed(1)}`);
});

doc.save("relatorio_multiplo_completo.pdf");
}


function carregar(){carregarNome(lista.value)}

function carregarNome(n){
 let db=JSON.parse(localStorage.getItem(KEY))||{};
 if(db[n]) preencher(db[n]);
}

function excluir(){
 if(confirm("Excluir? Faça backup antes!")){
  let db=JSON.parse(localStorage.getItem(KEY))||{};
  delete db[lista.value];
  localStorage.setItem(KEY,JSON.stringify(db));
  listar();
 }
}

function backup(){
 let data=localStorage.getItem(KEY);
 let blob=new Blob([data]);
 let a=document.createElement("a");
 a.href=URL.createObjectURL(blob);
 a.download="backup.json";
 a.click();
 alert("Backup realizado!");
}

function gerarPDF(){
 const {jsPDF}=window.jspdf;
 let d=coletar();
 let doc=new jsPDF();
 let y=10;

 function add(t){
  let l=doc.splitTextToSize(t,180);
  l.forEach(x=>{
   if(y>280){doc.addPage();y=10}
   doc.text(x,10,y);
   y+=7;
  });
 }

 add(`Empresa: ${d.empresa}`);
 add(`Setor: ${d.setor}`);
 add(`Auditor: ${d.auditor}`);

 d.blocos.forEach(b=>{
  add(`${b.nome} - Nota: ${b.nota}`);
  add(b.desc);
 });

 let notas=d.blocos.map(b=>b.nota);
 add("Parecer: "+gerarParecer(notas));

 doc.save("relatorio.pdf");
}

function gerarXLS(){
 let ws=XLSX.utils.json_to_sheet([coletar()]);
 let wb=XLSX.utils.book_new();
 XLSX.utils.book_append_sheet(wb,ws,"Auditoria");
 XLSX.writeFile(wb,"relatorio.xlsx");
}

function exportarDashboard(){
 let link=document.createElement('a');
 link.href=document.getElementById('grafico').toDataURL();
 link.download='dashboard.png';
 link.click();
}

function preencher(d){
 Object.keys(d).forEach(k=>{
  if(document.getElementById(k)){
   document.getElementById(k).value = d[k];
  }
 });

 (d.blocos || []).forEach(b=>{
  document.getElementById('desc_'+b.nome).value = b.desc || "";
  document.getElementById('nota_'+b.nome).value = b.nota || "";
  if(b.img){
    document.getElementById('img_'+b.nome).src = b.img;
  }
 });

 atualizarDashboard((d.blocos || []).map(b=>b.nota));
}



function gerarParecer(notas){
 let media = notas.reduce((a,b)=>a+b,0)/notas.length;

 let texto="";
 if(media<=3) texto="Nível crítico de conformidade.";
 else if(media<=6) texto="Nível moderado, requer melhorias.";
 else if(media<=8) texto="Nível adequado.";
 else texto="Nível excelente.";

 return texto + " Média: " + media.toFixed(1);
}

let chart;

function atualizarDashboard(notas){
 let media=notas.reduce((a,b)=>a+b,0)/notas.length;

 document.getElementById('analise').innerText =
  "Média: "+media.toFixed(1);

 document.getElementById('parecer').innerText =
  gerarParecer(notas);

 let ctx=document.getElementById('grafico');
 if(chart) chart.destroy();

 chart=new Chart(ctx,{
  type:'bar',
  data:{
   labels:campos,
   datasets:[{data:notas}]
  }
 });
}


function salvar(){
 let nome=prompt("Nome do relatório:");
 if(!nome) return;

 let db = JSON.parse(localStorage.getItem(KEY)) || {};
 db[nome] = coletar();

 localStorage.setItem(KEY, JSON.stringify(db));

 alert("Salvo com sucesso!");
 listar();
}

function importar(e){
 let r=new FileReader();

 r.onload=()=>{
  try{
    let json = JSON.parse(r.result);
    localStorage.setItem(KEY, JSON.stringify(json));
    alert("Backup restaurado com sucesso!");
    listar();
  }catch{
    alert("Erro ao restaurar backup!");
  }
 };

 r.readAsText(e.target.files[0]);
}


function gerarRanking(){
 let db=JSON.parse(localStorage.getItem(KEY))||{};
 let ranking=[];

 Object.keys(db).forEach(n=>{
  let notas=(db[n].blocos||[]).map(b=>b.nota||0);
  let media=notas.reduce((a,b)=>a+b,0)/notas.length;
  let risco=10-media;

  ranking.push({nome:n,media,risco});
 });

 ranking.sort((a,b)=>b.risco-a.risco);

 let html="<h3>Ranking de Risco</h3>";
 html+="<table>";
 html+="<tr><th>Posição</th><th>Relatório</th><th>Média</th><th>Risco</th></tr>";

 ranking.forEach((r,i)=>{
  html+=`<tr>
    <td>${i+1}</td>
    <td>${r.nome}</td>
    <td>${r.media.toFixed(1)}</td>
    <td>${r.risco.toFixed(1)}</td>
  </tr>`;
 });

 html+="</table>";

 document.getElementById("rankingContainer").innerHTML = html;
}

/* MOSTRAR TUTORIAL COMPLETO */
function toggleTutorial(){
 let t = document.getElementById("tutorial");
 t.style.display = (t.style.display === "none") ? "block" : "none";
}

/* MOSTRAR SETOR DO MENUBAR  CLICADO */
function mostrarSecao(secao){

  document.querySelectorAll('.pagina').forEach(p=>{
    p.style.display = 'none';
  });

  document.getElementById(secao).style.display = 'block';
};

/*==========================================
 TRAVAR A CÓPIA CONTEÚDO COM REF. AUTOR 
      bY: IRAÊ CÉSAR BRANDÃO - 05-2026
 ==========================================*/

//---------- BLOQUEAR CLIQUE DIREITO ----------
document.addEventListener('contextmenu', function(e) {
    e.preventDefault(); // Bloqueia o menu do botão direito
    alert("Copiar conteúdo não é permitido sem referência ao autor '© 2026 Iraê César Brandão - https://luckway.com.br' .");
});

// ---------- BLOQUEAR CTRL+C E CTRL+X ----------
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && (e.key === 'c' || e.key === 'x')) {
        e.preventDefault(); // Bloqueia copiar e recortar
        alert("Copiar/Recortar desativado. Cite o autor! '© 2026 Iraê César Brandão - https://luckway.com.br'");
    }
});


mostrarSecao('home');

window.addEventListener("beforeunload",e=>{e.preventDefault();e.returnValue="Faça backup antes de sair!"});
listar();
