const $ = id => document.getElementById(id);

const imoveis = [
    {
        img: 'img/casa1.jpg',
        titulo: 'Casa de madeira',
        valor: 'R$ 1.000,00',
        desc: 'Casa de madeira com estilo rústico e aconchegante, ideal para quem busca '
            + 'tranquilidade e contato com a natureza.',
        dono: [
            'Proprietário',
            'Atendimento direto com o dono do imóvel, sem intermediários.',
            'img/im.png',
            'proprietario'
        ]
    },
    {
        img: 'img/casa2.jpg',
        titulo: 'Casa com piscina',
        valor: 'R$ 2.500,00',
        desc: 'Casa moderna com piscina, área gourmet completa, vista panorâmica e amplo '
            + 'espaço para lazer em família.',
        dono: [
            'Maria Souza',
            'Corretora especializada em imóveis de alto padrão com piscina e áreas de lazer.',
            'img/im.png',
            'maria'
        ]
    },
    {
        img: 'img/casa3.jpg',
        titulo: 'Casa clássica',
        valor: 'R$ 1.800,00',
        desc: 'Casa clássica, ampla e muito bem iluminada, ideal para famílias grandes que '
            + 'buscam conforto e tradição.',
        dono: [
            'Carlos Lima',
            '20 anos de experiência em imóveis clássicos e tradicionais. '
                + 'Negociação segura e transparente.',
            'img/im.png',
            'carlos'
        ]
    }
];

const salvos = () => {
    try {
        return JSON.parse(localStorage.getItem('salvos')) || [];
    } catch {
        return [];
    }
};

let atual = Math.max(0, Number(location.hash.slice(1)) - 1) % imoveis.length;

function aviso(mensagem) {
    $('aviso').textContent = mensagem;
    $('aviso').classList.add('on');
    setTimeout(() => $('aviso').classList.remove('on'), 2500);
}

function cartaoParecido(imovel, indice) {
    return `
        <button class="cartao" type="button" data-i="${indice}">
            <img src="${imovel.img}" alt="${imovel.titulo}" loading="lazy">
            <span class="corpo">
                <h3>${imovel.titulo}</h3>
                <p>${imovel.desc}</p>
                <span class="preco">${imovel.valor}</span>
            </span>
        </button>`;
}

function mostrar(indice) {
    atual = (indice + imoveis.length) % imoveis.length;
    const imovel = imoveis[atual];
    const foto = $('foto');

    /* troca a foto com um fade rápido */
    foto.classList.add('troca');
    setTimeout(() => {
        foto.src = imovel.img;
        foto.alt = imovel.titulo;
        foto.classList.remove('troca');
    }, 250);

    $('titulo').textContent = imovel.titulo;
    $('valor').textContent = imovel.valor;
    $('desc').textContent = imovel.desc;
    $('dono-nome').textContent = imovel.dono[0];
    $('dono-desc').textContent = imovel.dono[1];
    $('dono-img').src = imovel.dono[2];
    document.title = `${imovel.titulo} | Imóveis_Sell`;
    history.replaceState(null, '', '#' + (atual + 1));

    document.querySelectorAll('#miniaturas button').forEach((botao, k) => {
        botao.setAttribute('aria-current', k === atual);
    });

    const jaSalvo = salvos().includes(atual);
    $('salvar').classList.toggle('salvo', jaSalvo);
    $('salvar').setAttribute('aria-pressed', jaSalvo);
    $('salvar').textContent = jaSalvo ? 'Salvo ✓' : 'Salvar';

    $('parecidas').innerHTML = imoveis
        .map((p, k) => (k === atual ? '' : cartaoParecido(p, k)))
        .join('');
}

imoveis.forEach((imovel, i) => {
    $('miniaturas').insertAdjacentHTML(
        'beforeend',
        `<button type="button" aria-label="Ver ${imovel.titulo}"><img src="${imovel.img}" alt=""></button>`
    );
    $('miniaturas').lastChild.onclick = () => mostrar(i);
});

document.querySelector('.ant').onclick = () => mostrar(atual - 1);
document.querySelector('.prox').onclick = () => mostrar(atual + 1);

document.addEventListener('keydown', evento => {
    if (evento.key === 'ArrowLeft') mostrar(atual - 1);
    if (evento.key === 'ArrowRight') mostrar(atual + 1);
});

$('parecidas').onclick = evento => {
    const cartao = evento.target.closest('[data-i]');
    if (cartao) {
        mostrar(Number(cartao.dataset.i));
        scrollTo({ top: 0, behavior: 'smooth' });
    }
};

$('quero').onclick = () => {
    const imovel = imoveis[atual];
    const idDono = imovel.dono[3];
    const mensagem = `Olá! Tenho interesse no imóvel "${imovel.titulo}" (${imovel.valor}). Ainda está disponível?`;

    adicionarContato(idDono, { titulo: imovel.titulo, idx: atual + 1 }, mensagem);
    location.href = 'perfil.html#' + idDono;
};

$('salvar').onclick = () => {
    const lista = salvos();
    const estavaSalvo = lista.includes(atual);
    const nova = estavaSalvo ? lista.filter(x => x !== atual) : [...lista, atual];

    localStorage.setItem('salvos', JSON.stringify(nova));
    mostrar(atual);
    aviso(estavaSalvo ? 'Removido dos salvos.' : 'Imóvel salvo.');
};

mostrar(atual);
