const $ = id => document.getElementById(id);

const esc = texto => String(texto).replace(/[&<>"']/g, caractere => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
}[caractere]));

const EMOJIS = ['😀', '😊', '😍', '👍', '🙏', '🏡', '🔑', '💰', '📅', '✅', '😉', '🎉'];

const RESPOSTAS = [
    'Olá! Sim, o imóvel continua disponível. Quer agendar uma visita?',
    'Claro! Posso te enviar mais fotos e os detalhes do contrato.',
    'Combinado! Qual dia e horário ficam melhores para você?',
    'Perfeito. Qualquer dúvida é só me chamar por aqui.'
];

const chat = lerChat();
let ativoId = null;
let digitandoId = null;

const achar = id => chat.contatos.find(c => c.id === id);
const ultima = contato => contato.msgs[contato.msgs.length - 1];
const salvar = () => salvarChat(chat);
const telaGrande = () => matchMedia('(min-width:901px)').matches;

const usuario = () => {
    try {
        return JSON.parse(localStorage.getItem('usuarioLogado'));
    } catch {
        return null;
    }
};

/* ---------- Datas e horas ---------- */
const hora = ts => new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const inicioDoDia = ts => new Date(ts).setHours(0, 0, 0, 0);

function rotuloDia(ts) {
    const diferenca = Math.round((inicioDoDia(Date.now()) - inicioDoDia(ts)) / 864e5);

    if (diferenca <= 0) return 'Hoje';
    if (diferenca === 1) return 'Ontem';
    return new Date(ts).toLocaleDateString('pt-BR');
}

function resumoHora(ts) {
    const rotulo = rotuloDia(ts);
    return rotulo === 'Hoje' ? hora(ts) : rotulo;
}

/* ---------- Perfil do usuário ---------- */
function renderPerfil() {
    const u = usuario();

    $('nome_usuario').textContent = u ? u.nome : 'Visitante';
    $('foto_usuario').src = (u && u.foto) || 'img/Perfil.jpg';
    $('desc_usuario').textContent =
        localStorage.getItem('perfilDescricao') || 'Procurando o imóvel ideal para minha família.';
}

function fecharEdicao() {
    $('form_desc').hidden = true;
    $('desc_usuario').hidden = false;
    $('editar_desc').hidden = false;
}

$('editar_desc').onclick = () => {
    $('campo_desc').value = $('desc_usuario').textContent;
    $('form_desc').hidden = false;
    $('desc_usuario').hidden = true;
    $('editar_desc').hidden = true;
    $('campo_desc').focus();
};

$('cancelar_desc').onclick = fecharEdicao;

$('form_desc').onsubmit = evento => {
    evento.preventDefault();
    const texto = $('campo_desc').value.trim();

    if (texto) {
        localStorage.setItem('perfilDescricao', texto);
    } else {
        localStorage.removeItem('perfilDescricao');
    }

    renderPerfil();
    fecharEdicao();
};

/* ---------- Lista de contatos ---------- */
function statusTexto(contato) {
    return digitandoId === contato.id ? 'digitando...' : contato.status;
}

function previaDoContato(contato) {
    const mensagem = ultima(contato);

    if (digitandoId === contato.id) {
        return '<span class="previa digitando">digitando...</span>';
    }
    if (contato.naoLidas > 0) {
        return '<span class="previa nova">Nova mensagem</span>';
    }

    const autor = mensagem && mensagem.de === 'eu' ? 'Você: ' : '';
    const texto = mensagem ? esc(mensagem.texto) : 'Sem mensagens';
    return `<span class="previa">${autor}${texto}</span>`;
}

function itemDoContato(contato) {
    const mensagem = ultima(contato);
    const horario = mensagem ? resumoHora(mensagem.ts) : '';
    const selo = contato.naoLidas > 0
        ? `<span class="badge" aria-label="${contato.naoLidas} não lidas">${contato.naoLidas}</span>`
        : '';

    return `
        <button class="contato" type="button" data-id="${contato.id}" aria-current="${contato.id === ativoId}">
            <span class="avatar">
                <img src="${esc(contato.foto)}" alt="">
                <span class="ponto ${contato.status}" title="${contato.status}"></span>
            </span>
            <span class="info_contato">
                <strong>${esc(contato.nome)}</strong>
                ${previaDoContato(contato)}
            </span>
            <span class="meta_contato">${horario}${selo}</span>
        </button>`;
}

function renderLista() {
    const busca = $('busca_contato').value.trim().toLowerCase();
    const horaDaUltima = contato => (ultima(contato) ? ultima(contato).ts : 0);

    const lista = chat.contatos
        .filter(c => !busca || c.nome.toLowerCase().includes(busca))
        .sort((a, b) => horaDaUltima(b) - horaDaUltima(a));

    $('contagem').textContent = chat.contatos.length;

    if (!lista.length) {
        const aviso = chat.contatos.length
            ? 'Nenhum contato encontrado.'
            : 'Você ainda não falou com nenhum proprietário. Abra um imóvel e toque em “Quero essa!”.';
        $('lista').innerHTML = `<p class="lista_vazia">${aviso}</p>`;
        return;
    }

    $('lista').innerHTML = lista.map(itemDoContato).join('');
}

$('lista').onclick = evento => {
    const botao = evento.target.closest('[data-id]');
    if (botao) abrir(botao.dataset.id);
};

$('busca_contato').oninput = renderLista;

/* ---------- Conversa ---------- */
function renderCabecalho() {
    const contato = achar(ativoId);
    if (!contato) return;

    const estado = digitandoId === contato.id ? 'digitando' : contato.status;
    const link = $('ver_imovel');

    $('foto_contato').src = contato.foto;
    $('nome_contato').textContent = contato.nome;
    $('status_contato').textContent = statusTexto(contato);
    $('status_contato').className = 'status ' + estado;

    link.hidden = !contato.imovel;
    if (contato.imovel) {
        link.textContent = 'Ver ' + contato.imovel.titulo;
        link.href = 'venda.html#' + contato.imovel.idx;
    }
}

function renderMensagens() {
    const contato = achar(ativoId);
    if (!contato) return;

    let anterior = null;
    let html = '';

    contato.msgs.forEach(mensagem => {
        if (anterior === null || inicioDoDia(mensagem.ts) !== inicioDoDia(anterior)) {
            html += `<div class="dia">${rotuloDia(mensagem.ts)}</div>`;
        }

        const confirmacao = mensagem.de === 'eu' ? ' ✓' : '';
        html += `
            <div class="msg ${mensagem.de}">
                <p>${esc(mensagem.texto)}</p>
                <time>${hora(mensagem.ts)}${confirmacao}</time>
            </div>`;
        anterior = mensagem.ts;
    });

    const caixa = $('mensagens');
    caixa.innerHTML = html;
    caixa.scrollTop = caixa.scrollHeight;
}

function renderTudo() {
    renderLista();

    const temConversa = !!achar(ativoId);
    $('sem_conversa').hidden = temConversa;
    $('painel_chat').hidden = !temConversa;

    if (temConversa) {
        renderCabecalho();
        renderMensagens();
    }
}

function abrir(id) {
    const contato = achar(id);
    if (!contato) return;

    ativoId = id;
    contato.naoLidas = 0;
    salvar();

    $('app').classList.add('conversa_aberta');
    history.replaceState(null, '', '#' + id);
    renderTudo();

    if (telaGrande()) $('campo_msg').focus();
    responder(id);
}

$('voltar').onclick = () => {
    $('app').classList.remove('conversa_aberta');
    ativoId = null;
    history.replaceState(null, '', location.pathname);
    renderTudo();
};

/* O proprietário (se estiver online) "digita" por um instante e responde */
function responder(id) {
    const contato = achar(id);

    if (!contato || !contato.aguardando || contato.status !== 'online' || digitandoId) {
        return;
    }

    digitandoId = id;
    renderTudo();

    setTimeout(() => {
        contato.msgs.push({
            de: 'outro',
            texto: RESPOSTAS[contato.msgs.length % RESPOSTAS.length],
            ts: Date.now()
        });
        contato.aguardando = false;
        digitandoId = null;

        if (ativoId !== id) contato.naoLidas++;

        salvar();
        renderTudo();
    }, 1800);
}

$('form_msg').onsubmit = evento => {
    evento.preventDefault();

    const contato = achar(ativoId);
    const texto = $('campo_msg').value.trim();
    if (!contato || !texto) return;

    contato.msgs.push({ de: 'eu', texto, ts: Date.now() });
    if (contato.status === 'online') contato.aguardando = true;

    salvar();
    $('campo_msg').value = '';
    fecharEmojis();
    renderTudo();
    responder(contato.id);
};

/* ---------- Emojis ---------- */
$('emojis').innerHTML = EMOJIS
    .map(emoji => `<button type="button" role="menuitem">${emoji}</button>`)
    .join('');

function fecharEmojis() {
    $('emojis').classList.remove('aberto');
    $('botao_emoji').setAttribute('aria-expanded', 'false');
}

$('botao_emoji').onclick = () => {
    const aberto = $('emojis').classList.toggle('aberto');
    $('botao_emoji').setAttribute('aria-expanded', aberto);
};

$('emojis').onclick = evento => {
    if (evento.target.tagName !== 'BUTTON') return;

    $('campo_msg').value += evento.target.textContent;
    $('campo_msg').focus();
};

document.addEventListener('keydown', evento => {
    if (evento.key === 'Escape') fecharEmojis();
});

document.addEventListener('click', evento => {
    if (!evento.target.closest('#emojis, #botao_emoji')) fecharEmojis();
});

/* ---------- Início ---------- */
renderPerfil();

const idInicial = location.hash.slice(1);

if (achar(idInicial)) {
    abrir(idInicial);
} else if (telaGrande() && chat.contatos.length) {
    abrir(chat.contatos[0].id);
} else {
    renderTudo();
}
