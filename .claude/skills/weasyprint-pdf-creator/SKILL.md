---
name: weasyprint-pdf-creator
description: Criação profissional de PDFs diagramados a partir de templates HTML/CSS usando WeasyPrint. Ensina a usar CSS Paged Media, running headers, quebras de página controladas e otimização para PDFs prontos para impressão.
type: prompt
version: 1.0.0
categories:
  - pdf
  - design
  - reporting
---

# WeasyPrint PDF Creator (Expert Skill)

Esta skill capacita agentes a projetar, estruturar e gerar documentos PDF de alta qualidade e com acabamento editorial usando o **WeasyPrint** e a especificação de **CSS Paged Media (CSS Paginado)**.

---

## 1. Quando Usar vs. Quando Não Usar

| Cenário | Recomendação | Ferramenta |
| :--- | :--- | :--- |
| Criar novos documentos de negócio com design premium (Faturas, Relatórios, Contratos, E-books, Propostas) | **Usar esta Skill** | WeasyPrint |
| Converter Markdown simples em PDF sem controle rígido de layout | **Opcional** | Pandoc / WeasyPrint |
| Editar texto direto em um PDF existente sem o código-fonte | **Não usar** | nano-pdf / PyMuPDF |
| Extrair/fazer OCR em imagens/PDFs escaneados | **Não usar** | OCR / PyMuPDF |
| Capturar dashboards interativos pesados em JavaScript | **Não usar** | Playwright / Headless Chrome |

---

## 2. Recursos Globais Disponíveis no Projeto

Para agilizar o desenvolvimento e evitar duplicidade de código, o projeto conta com os seguintes recursos globais:

*   **Script de Compilação**: [render_pdf.py](scripts/render_pdf.py)
    *   Uso: `python .claude/skills/weasyprint-pdf-creator/scripts/render_pdf.py <template.html> <output.pdf> -d <dados.json> -c .claude/skills/weasyprint-pdf-creator/assets/base_print.css`
    *   Dependências: `pip install weasyprint jinja2`
*   **CSS Boilerplate**: [base_print.css](assets/base_print.css)
    *   Contém regras prontas para margens, running headers e formatação padrão A4.
*   **Exemplo pronto**: [examples/documento.html](examples/documento.html) + [examples/dados.json](examples/dados.json)

---

## 3. Princípios de Nível Sênior para WeasyPrint

O WeasyPrint é um motor de renderização baseado em HTML/CSS, porém ele funciona seguindo o padrão de **mídia impressa (paged media)**, e não de tela. Desenvolvedores experientes aplicam os seguintes conceitos:

### A. Anatomia da Página (`@page`)
A folha física é controlada pela regra `@page`. Use sempre dimensões físicas padrão (`A4`, `Letter`) e defina as margens de forma a reservar espaço para cabeçalhos e rodapés:

```css
@page {
    size: A4;
    margin: 20mm 15mm 20mm 15mm; /* Topo, Direita, Base, Esquerda */
}
```

### B. Diferenciação de Páginas (Capa vs. Conteúdo)
A capa não deve conter cabeçalho nem número de página. Use a pseudo-classe `:first` para remover ou alterar propriedades da primeira página:

```css
@page:first {
    margin: 0; /* Margem zero para cobrir toda a página com a imagem/fundo da capa */
    @top-left { content: none; }
    @bottom-right { content: none; }
}
```

Para layouts de encadernação frente/verso (livros ou relatórios encadernados), use `:left` e `:right` para alternar margens internas/externas (gutter):

```css
@page:left {
    margin-left: 20mm; /* Espaço para espiral/encadernação */
    margin-right: 15mm;
}
@page:right {
    margin-left: 15mm;
    margin-right: 20mm;
}
```

### C. Cabeçalhos e Rodapés Dinâmicos (Running Elements)
Para cabeçalhos/rodapés complexos (que contêm imagens, logos ou múltiplas linhas HTML), **nunca** use posicionamento absoluto. Use a técnica de **Running Elements**:

1. No HTML, marque o cabeçalho/rodapé com uma classe dedicada:
   ```html
   <header class="meu-cabecalho">
       <img src="logo.png" alt="Logo" class="logo">
       <span>Relatório Executivo Mensal</span>
   </header>
   ```
2. No CSS, retire o elemento do fluxo do documento e associe-o a um identificador dinâmico:
   ```css
   header.meu-cabecalho {
       position: running(cabecalho-da-pagina);
   }
   ```
3. Na regra `@page`, injete o elemento no box de margem adequado:
   ```css
   @page {
       margin-top: 30mm; /* Aumente a margem superior para acomodar o cabeçalho */
       @top-center {
           content: element(cabecalho-da-pagina);
       }
   }
   ```

### D. Paginação Automática (Counters)
Exiba o número da página atual e o total usando os contadores nativos `page` e `pages` diretamente em um box de margem:

```css
@page {
    @bottom-right {
        content: "Página " counter(page) " de " counter(pages);
        font-size: 8pt;
        color: #718096;
    }
}
```

### E. Controle Estrito de Quebras de Página
Evite que elementos fiquem órfãos ou quebrados pela metade entre uma página e outra.
- **Evitar quebra dentro de elementos lógicos** (ex: caixas de estatísticas, imagens, assinaturas, parágrafos curtos):
  ```css
  .card, .stat-box, figure, tr {
      break-inside: avoid;
      page-break-inside: avoid;
  }
  ```
- **Forçar quebra de página antes de seções principais**:
  ```css
  h2.section-title, .nova-pagina {
      break-before: page;
      page-break-before: always;
  }
  ```
- **Evitar títulos órfãos** (um título renderizado no fim da página sem o respectivo conteúdo):
  ```css
  h1, h2, h3, h4, h5, h6 {
      break-after: avoid;
      page-break-after: avoid;
  }
  ```

### E.1. Sumário com números de página
**Atenção:** no WeasyPrint, `target-counter()` em um `::after` de item **flex** retorna `0`. Use bloco + `leader()` (já aplicado em `assets/base_print.css`):
```css
.toc-item a { display: block; }
.toc-item a::after { content: leader(dotted) target-counter(attr(href), page); }
```

### F. Tabelas Longas e Segmentadas
Para relatórios de dados que ocupam várias páginas:
1. Sempre use `thead` e `tfoot`. O WeasyPrint repetirá o cabeçalho e o rodapé da tabela automaticamente em cada página onde a tabela quebrar.
2. Force o alinhamento de números usando `font-variant-numeric: tabular-nums` para que colunas financeiras e quantitativas alinhem perfeitamente.

---

## 4. Estrutura Recomendada do Repositório

Organize os projetos que geram PDF seguindo esta estrutura limpa:

```text
pdf-generator/
│
├── templates/
│   ├── base.html          # Template base com blocos Jinja2
│   └── ebook_draft.html   # Template específico
│
├── styles/
│   └── print.css          # Folha de estilo CSS Paged Media
│
├── scripts/
│   └── render_pdf.py      # Script Python de compilação
│
└── assets/
    ├── fonts/             # Fontes locais (.ttf / .woff)
    └── images/            # Logos, ilustrações e gráficos estáticos
```

---

## 5. Como Executar a Renderização (Python & CLI)

O WeasyPrint pode ser executado via linha de comando ou via script Python. O script abaixo (`render_pdf.py`) é o padrão ouro recomendado pois implementa renderização via Jinja2 e suporte a estilos dinâmicos:

### Execução via Python (Recomendado)
```python
from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration
from jinja2 import Environment, FileSystemLoader

# Configurar o Jinja2
env = Environment(loader=FileSystemLoader('templates/'))
template = env.get_template('ebook_draft.html')
html_content = template.render(title="Meu E-book", author="OpenSquad Agent")

# Configurar Fontes e CSS
font_config = FontConfiguration()
css = CSS('styles/print.css', font_config=font_config)

# Renderizar
HTML(string=html_content).write_pdf(
    'output.pdf',
    stylesheets=[css],
    font_config=font_config,
    presentational_hints=True # Ativa atributos HTML legados como 'align', 'bgcolor' etc.
)
```

---

## 6. Checklist de Garantia de Qualidade (QA)

Antes de entregar o PDF gerado ao usuário, execute este checklist visual:
1. **Quebras Indesejadas**: O texto quebrou no meio de um card ou parágrafo importante? (Use `break-inside: avoid`).
2. **Textos Curtados / Overflow**: Há textos ou caixas ultrapassando o limite direito da página A4? (Use `word-wrap: break-word` ou reavalie a largura das colunas).
3. **Capa**: A capa tem cabeçalho ou número de página? (Use `@page:first` para eliminá-los).
4. **Fontes**: Os caracteres acentuados estão renderizando com a fonte correta ou voltando para a fonte padrão do sistema? (Instale as fontes localmente ou defina o `@font-face` com caminhos absolutos/relativos corretos).
5. **Resolução de Imagens**: Logos e ícones estão pixelados? (Use SVG ou imagens de alta resolução com tamanho controlado no CSS).

---

## 7. Exemplo de Boilerplate Completo

### HTML (`templates/documento.html`)
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>{{ title }}</title>
</head>
<body>

    <!-- Definição do Cabeçalho Paginado -->
    <header class="doc-header">
        <div class="header-inner">
            <span class="company-name">Empresa S/A</span>
            <span class="doc-meta">{{ title }}</span>
        </div>
    </header>

    <!-- Capa do Livro/Documento -->
    <section class="cover-page">
        <div class="cover-content">
            <h1>{{ title }}</h1>
            <p class="subtitle">{{ subtitle }}</p>
            <p class="author">Por: {{ author }}</p>
        </div>
    </section>

    <!-- Quebra para o conteúdo principal -->
    <div class="page-break"></div>

    <!-- Página de Índice / Table of Contents -->
    <section class="toc-section">
        <h2>Sumário</h2>
        <ul class="toc-list">
            <li class="toc-item">
                <a href="#introducao">
                    <span class="toc-name">Introdução</span>
                    <span class="toc-leader"></span>
                </a>
            </li>
            <li class="toc-item">
                <a href="#metodologia">
                    <span class="toc-name">Metodologia</span>
                    <span class="toc-leader"></span>
                </a>
            </li>
        </ul>
    </section>

    <div class="page-break"></div>

    <!-- Seções de Conteúdo -->
    <section id="introducao">
        <h2 class="section-title">Introdução</h2>
        <p>Conteúdo da introdução...</p>
    </section>

</body>
</html>
```

### CSS (`styles/print.css`)
```css
/* Importando fontes */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

/* Regras Globais de Página */
@page {
    size: A4;
    margin: 25mm 15mm 20mm 15mm;
    
    @top-center {
        content: element(doc-header);
        width: 100%;
    }
    
    @bottom-right {
        content: counter(page) " de " counter(pages);
        font-family: 'Inter', sans-serif;
        font-size: 8pt;
        color: #a0aec0;
    }
}

/* Regra Especial para Capa */
@page:first {
    margin: 0;
    @top-center { content: none; }
    @bottom-right { content: none; }
}

/* Configuração do Header Running */
header.doc-header {
    position: running(doc-header);
    width: 100%;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 5px;
}

.header-inner {
    display: flex;
    justify-content: space-between;
    font-family: 'Inter', sans-serif;
    font-size: 8pt;
    color: #718096;
}

/* Estilo da Capa */
.cover-page {
    width: 210mm;
    height: 297mm;
    background-color: #1a202c;
    color: white;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 40mm 20mm;
    box-sizing: border-box;
}

.cover-page h1 {
    font-size: 32pt;
    margin-bottom: 10px;
}

.cover-page .subtitle {
    font-size: 18pt;
    color: #a0aec0;
    margin-bottom: 30px;
}

/* Quebras de Página */
.page-break {
    break-before: page;
    page-break-before: always;
}

/* Estilo do Sumário (TOC) */
.toc-list {
    list-style: none;
    padding: 0;
}

.toc-item {
    margin-bottom: 10px;
}

.toc-item a {
    display: flex;
    text-decoration: none;
    color: #2d3748;
    align-items: baseline;
}

.toc-name {
    order: 1;
}

.toc-leader {
    order: 2;
    flex-grow: 1;
    border-bottom: 1px dotted #cbd5e0;
    margin: 0 10px;
}

.toc-item a::after {
    order: 3;
    content: target-counter(attr(href), page);
    font-weight: bold;
}
```
