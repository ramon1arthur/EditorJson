const fileInput = document.getElementById("fileInput");
const saveIcon = document.getElementById("saveIcon");
const undoIcon = document.getElementById("undoIcon");
const redoIcon = document.getElementById("redoIcon");
const deleteKeyBtn = document.getElementById("deleteKeyBtn");
const moveUpBtn = document.getElementById("moveUpBtn");
const moveDownBtn = document.getElementById("moveDownBtn");
const addKeyBtn = document.getElementById("addKeyBtn");
const keyList = document.getElementById("keyList");
const keyInput = document.getElementById("keyInput");
const valueInput = document.getElementById("valueInput");
const commentInput = document.getElementById("commentInput");
const updateBtn = document.getElementById("updateBtn");
const searchInput = document.getElementById("searchInput");
const searchIcon = document.getElementById("searchIcon");
const searchNav = document.getElementById("searchNav");
const searchUp = document.getElementById("searchUp");
const searchDown = document.getElementById("searchDown");

let jsonData = null;
let selectedKeyIndex = null;
let undoStack = [];
let redoStack = [];
let modifiedKeys = new Set(); // Armazena as chaves modificadas
let searchResults = []; // Resultados da pesquisa
let currentSearchIndex = -1; // Índice do resultado atual

// Ler arquivo JSON
fileInput.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsedJson = JSON.parse(e.target.result);

        if (!validateJsonStructure(parsedJson)) {
          throw new Error("Estrutura inválida do JSON.");
        }

        jsonData = parsedJson;
        populateKeyList(jsonData.items);
        selectedKeyIndex = null;
        undoStack = [];
        redoStack = [];
        modifiedKeys.clear();
      } catch (error) {
        alert("Erro ao carregar o JSON: " + error.message);
      }
    };
    reader.readAsText(file);
  }
});

// Validar estrutura do JSON
function validateJsonStructure(json) {
  if (!json.items || !Array.isArray(json.items)) {
    alert("Arquivo JSON inválido. Certifique-se de que ele contém uma chave 'items' com uma lista.");
    return false;
  }
  for (let item of json.items) {
    if (!item.key || typeof item.key !== "string") {
      alert("Alguns itens não possuem uma chave 'key' válida.");
      return false;
    }
  }
  return true;
}

// Preencher a lista de chaves
function populateKeyList(items) {
  keyList.innerHTML = "";
  items.forEach((item, index) => {
    const li = document.createElement("li");
    li.dataset.index = index;
    li.textContent = item.key;

    // Adiciona destaque para chaves modificadas
    if (modifiedKeys.has(item.key)) {
      li.classList.add("modified");
    }

    li.addEventListener("click", () => selectKey(index));
    keyList.appendChild(li);
  });
}

// Selecionar chave
function selectKey(index) {
  selectedKeyIndex = index;
  const items = document.querySelectorAll("#keyList li");
  items.forEach((item) => item.classList.remove("active"));
  items[index].classList.add("active");

  const selectedItem = jsonData.items[index];
  keyInput.value = selectedItem.key || "";
  valueInput.value = selectedItem.value || "";
  commentInput.value = selectedItem.comment || "";
}

// Adicionar nova chave
addKeyBtn.addEventListener("click", () => {
  const newKey = { key: "Nova Chave", value: "", comment: "" };
  const insertIndex = selectedKeyIndex !== null ? selectedKeyIndex + 1 : jsonData.items.length;
  jsonData.items.splice(insertIndex, 0, newKey);
  populateKeyList(jsonData.items);
  selectKey(insertIndex);
});

// Apagar chave
deleteKeyBtn.addEventListener("click", () => {
  if (selectedKeyIndex !== null) {
    jsonData.items.splice(selectedKeyIndex, 1);
    populateKeyList(jsonData.items);
    selectedKeyIndex = null;
    keyInput.value = "";
    valueInput.value = "";
    commentInput.value = "";
  } else {
    alert("Nenhuma chave selecionada para apagar.");
  }
});

// Atualizar chave
updateBtn.addEventListener("click", () => {
  if (selectedKeyIndex !== null) {
    const selectedItem = jsonData.items[selectedKeyIndex];
    selectedItem.key = keyInput.value;
    selectedItem.value = valueInput.value;
    selectedItem.comment = commentInput.value || undefined;

    modifiedKeys.add(selectedItem.key); // Marca como modificada
    populateKeyList(jsonData.items); // Atualiza a lista com os destaques
    selectKey(selectedKeyIndex); // Reseleciona a chave
    alert("Chave atualizada com sucesso!");
  } else {
    alert("Nenhuma chave selecionada para atualizar.");
  }
});

// Mover chave para cima
moveUpBtn.addEventListener("click", () => {
  if (selectedKeyIndex > 0) {
    [jsonData.items[selectedKeyIndex - 1], jsonData.items[selectedKeyIndex]] =
      [jsonData.items[selectedKeyIndex], jsonData.items[selectedKeyIndex - 1]];
    populateKeyList(jsonData.items);
    selectKey(selectedKeyIndex - 1);
  }
});

// Mover chave para baixo
moveDownBtn.addEventListener("click", () => {
  if (selectedKeyIndex < jsonData.items.length - 1) {
    [jsonData.items[selectedKeyIndex + 1], jsonData.items[selectedKeyIndex]] =
      [jsonData.items[selectedKeyIndex], jsonData.items[selectedKeyIndex + 1]];
    populateKeyList(jsonData.items);
    selectKey(selectedKeyIndex + 1);
  }
});

// Salvar JSON
saveIcon.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "edited.json";
  a.click();
  URL.revokeObjectURL(url);
  alert("JSON salvo com sucesso!");
});

// Atalhos de teclado
document.addEventListener("keydown", (event) => {
  if (event.ctrlKey && event.key === "s") {
    event.preventDefault();
    saveIcon.click();
  } else if (event.ctrlKey && event.key === "n") {
    event.preventDefault();
    addKeyBtn.click();
  }
});

// Pesquisa no JSON
searchIcon.addEventListener("click", () => {
  const query = searchInput.value.toLowerCase().trim();

  if (!query) {
    alert("Digite algo para pesquisar!");
    return;
  }

  searchResults = [];
  currentSearchIndex = -1;

  jsonData.items.forEach((item, index) => {
    if (
      (item.key && item.key.toLowerCase().includes(query)) ||
      (item.value && item.value.toLowerCase().includes(query)) ||
      (item.comment && item.comment.toLowerCase().includes(query))
    ) {
      searchResults.push(index);
    }
  });

  if (searchResults.length > 0) {
    searchNav.style.display = "flex";
    currentSearchIndex = 0;
    highlightSearchResult();
  } else {
    searchNav.style.display = "none";
    alert("Nenhum resultado encontrado.");
  }
});

// Destacar e selecionar resultado
function highlightSearchResult() {
  if (currentSearchIndex < 0 || currentSearchIndex >= searchResults.length) return;
  const resultIndex = searchResults[currentSearchIndex];
  selectKey(resultIndex);

  const listItem = keyList.children[resultIndex];
  if (listItem) {
    listItem.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

// Navegar para o próximo resultado
searchDown.addEventListener("click", () => {
  if (searchResults.length === 0) return;
  currentSearchIndex = (currentSearchIndex + 1) % searchResults.length;
  highlightSearchResult();
});

// Navegar para o resultado anterior
searchUp.addEventListener("click", () => {
  if (searchResults.length === 0) return;
  currentSearchIndex =
    (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
  highlightSearchResult();
});
