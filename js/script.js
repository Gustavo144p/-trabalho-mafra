const $ = id => document.getElementById(id);

const esc = texto => String(texto).replace(/[&<>"']/g, caractere => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
}[caractere]));

function aviso(mensagem) {
    const caixa = $('aviso');
    caixa.textContent = mensagem;
    caixa.classList.add('on');
    setTimeout(() => caixa.classList.remove('on'), 2500);
}

/* ---------- Perfil e login ---------- */
const usuario = () => {
    try {
        return JSON.parse(localStorage.getItem('usuarioLogado'));
    } catch {
        return null;
    }
};

function atualizar_perfil() {
    const u = usuario();
    const menu = $('menu_perfil');

    $('nome_perfil').textContent = u ? u.nome : 'Visitante';

    if (u) {
        menu.innerHTML = `
            <h3>${esc(u.nome)}</h3>
            <p class="email_perfil">${esc(u.email)}</p>
            <a class="link_perfil" href="perfil.html">Meu perfil</a>
            <button type="button" id="botao_sair" class="botao_sair">Sair</button>`;

        $('botao_sair').onclick = () => {
            localStorage.removeItem('usuarioLogado');
            menu.classList.remove('aberto');
            atualizar_perfil();
            aviso('Você saiu da conta.');
        };
    } else {
        menu.innerHTML = `
            <h3>Você não está logado</h3>
            <p class="email_perfil">Entre para salvar imóveis.</p>
            <a class="link_perfil" href="perfil.html">Meu perfil</a>
            <button type="button" id="botao_login">Fazer login</button>`;

        $('botao_login').onclick = () => {
            menu.classList.remove('aberto');
            abrir_login();
        };
    }
}

function abrir_login() {
    $('modal_login').classList.add('aberto');
    $('fundo_modal').classList.add('aberto');
    $('email_login').focus();
}

function fechar_login() {
    $('modal_login').classList.remove('aberto');
    $('fundo_modal').classList.remove('aberto');
    $('email_login').value = '';
    $('senha_login').value = '';
}

$('botao_perfil').onclick = evento => {
    evento.stopPropagation();
    $('menu_perfil').classList.toggle('aberto');
};

document.addEventListener('click', evento => {
    if (!evento.target.closest('#div_perfil')) {
        $('menu_perfil').classList.remove('aberto');
    }
});

$('confirmar_login').onclick = () => {
    const email = $('email_login').value.trim();
    const senha = $('senha_login').value.trim();

    if (!email.includes('@') || !senha) {
        aviso('Informe um e-mail válido e a senha.');
        return;
    }

    localStorage.setItem('usuarioLogado', JSON.stringify({ nome: 'João Alves', email }));
    fechar_login();
    atualizar_perfil();
    aviso('Login realizado com sucesso!');
};

$('fechar_modal').onclick = fechar_login;
$('fundo_modal').onclick = fechar_login;

document.addEventListener('keydown', evento => {
    if (evento.key === 'Escape') {
        fechar_login();
        $('menu_perfil').classList.remove('aberto');
    }
});

/* ---------- Busca (filtra os cartões de verdade) ---------- */
function filtrar() {
    const texto = $('campo_pesquisa').value.trim().toLowerCase();
    const local = $('localizacao').value.trim().toLowerCase();
    const tipo = $('tipo_imovel').value;
    const finalidade = $('finalidade').value;
    const precoMaximo = Number($('preco_maximo').value) || Infinity;
    let encontrados = 0;

    document.querySelectorAll('.cartao_propaganda').forEach(cartao => {
        const dados = cartao.dataset;
        const combina =
            (!texto || cartao.textContent.toLowerCase().includes(texto)) &&
            (!local || dados.local.includes(local)) &&
            (!tipo || dados.tipo === tipo) &&
            (!finalidade || dados.finalidade === finalidade) &&
            Number(dados.preco) <= precoMaximo;

        cartao.hidden = !combina;
        if (combina) encontrados++;
    });

    $('contagem').textContent = encontrados === 1 ? '(1 imóvel)' : `(${encontrados} imóveis)`;
    $('vazio').hidden = encontrados > 0;
    return encontrados;
}

$('botao_filtros').setAttribute('aria-expanded', 'false');
$('botao_filtros').onclick = () => {
    const aberto = $('filtros').classList.toggle('ativo');
    $('botao_filtros').setAttribute('aria-expanded', aberto);
};

$('botao_buscar').onclick = () => {
    const encontrados = filtrar();
    aviso(encontrados ? `${encontrados} imóvel(is) encontrado(s).` : 'Nenhum imóvel encontrado.');
    $('lista_imoveis').scrollIntoView({ behavior: 'smooth' });
};

$('botao_limpar').onclick = () => {
    ['campo_pesquisa', 'localizacao', 'tipo_imovel', 'finalidade', 'preco_maximo']
        .forEach(id => { $(id).value = ''; });
    filtrar();
};

$('campo_pesquisa').addEventListener('input', filtrar);

[$('localizacao'), $('preco_maximo')].forEach(campo => {
    campo.addEventListener('keydown', evento => {
        if (evento.key === 'Enter') $('botao_buscar').click();
    });
});

/* ---------- Carrossel ---------- */
const destaques = [
    ['img/f1.jpg', 'Casa moderna', 'Casa com 3 quartos e garagem'],
    ['img/f2.jpg', 'Apartamento completo', 'Apartamento bem localizado'],
    ['img/f3.jpg', 'Casa com área externa', 'Espaço amplo para toda a família']
];
const total = destaques.length;
let atual = 0;
let timer;

destaques.forEach(([imagem, titulo, descricao], i) => {
    $('slides').insertAdjacentHTML('beforeend', `
        <div class="slide">
            <img src="${imagem}" alt="${esc(titulo)}">
            <div class="informacoes_slide">
                <h2>${esc(titulo)}</h2>
                <p>${esc(descricao)}</p>
            </div>
        </div>`);

    const indicador = document.createElement('button');
    indicador.type = 'button';
    indicador.className = 'indicador';
    indicador.setAttribute('aria-label', `Ir para o slide ${i + 1}`);
    indicador.onclick = () => ir(i);
    $('indicadores').appendChild(indicador);
});

function ir(indice) {
    atual = (indice + total) % total;
    $('slides').style.transform = `translateX(-${atual * 100}%)`;

    document.querySelectorAll('.indicador').forEach((indicador, k) => {
        indicador.classList.toggle('ativo', k === atual);
    });

    parar();
    iniciar();
}

function parar() {
    clearInterval(timer);
}

function iniciar() {
    const reduzir = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduzir) {
        timer = setInterval(() => ir(atual + 1),2000);
    }
}

$('botao_anterior').onclick = () => ir(atual - 1);
$('botao_proximo').onclick = () => ir(atual + 1);
$('carrossel').addEventListener('mouseenter', parar);
$('carrossel').addEventListener('mouseleave', iniciar);

/* deslizar com o dedo no celular */
let inicioToque = null;

$('carrossel').addEventListener('touchstart', evento => {
    inicioToque = evento.touches[0].clientX;
}, { passive: true });

$('carrossel').addEventListener('touchend', evento => {
    const fim = evento.changedTouches[0].clientX;

    if (inicioToque !== null && Math.abs(fim - inicioToque) > 40) {
        ir(atual + (fim < inicioToque ? 1 : -1));
    }
    inicioToque = null;
});

$('carrossel').addEventListener('keydown', evento => {
    if (evento.key === 'ArrowLeft') ir(atual - 1);
    if (evento.key === 'ArrowRight') ir(atual + 1);
});

atualizar_perfil();
filtrar();
ir(0);
