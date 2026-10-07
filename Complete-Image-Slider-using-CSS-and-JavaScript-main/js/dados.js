/* Dados compartilhados entre venda.html e perfil.html (guardados no navegador) */
const CHAT_KEY = 'imoveisSell_chat';

const DONOS = {
    proprietario: {
        nome: 'Proprietário',
        foto: 'img/im.png',
        descricao: 'Atendimento direto com o dono do imóvel, sem intermediários.',
        status: 'online'
    },
    maria: {
        nome: 'Maria Souza',
        foto: 'img/im.png',
        descricao: 'Corretora de imóveis de alto padrão com piscina e áreas de lazer.',
        status: 'online'
    },
    carlos: {
        nome: 'Carlos Lima',
        foto: 'img/im.png',
        descricao: '20 anos de experiência em imóveis clássicos e tradicionais.',
        status: 'offline'
    }
};

function salvarChat(chat) {
    try {
        localStorage.setItem(CHAT_KEY, JSON.stringify(chat));
    } catch {
        /* armazenamento indisponível: a conversa só vale durante esta visita */
    }
}

function semente() {
    const agora = Date.now();
    const minuto = 60000;
    const dia = 864e5;

    return {
        contatos: [
            {
                id: 'maria',
                ...DONOS.maria,
                imovel: { titulo: 'Casa com piscina', idx: 2 },
                naoLidas: 1,
                aguardando: false,
                msgs: [
                    {
                        de: 'outro',
                        texto: 'Olá! Vi que você se interessou pela casa com piscina. Posso ajudar com alguma dúvida?',
                        ts: agora - 6 * minuto
                    }
                ]
            },
            {
                id: 'carlos',
                ...DONOS.carlos,
                imovel: { titulo: 'Casa clássica', idx: 3 },
                naoLidas: 0,
                aguardando: false,
                msgs: [
                    {
                        de: 'eu',
                        texto: 'Boa tarde! A casa clássica ainda está disponível?',
                        ts: agora - dia - 3600000
                    },
                    {
                        de: 'outro',
                        texto: 'Está sim! Podemos agendar uma visita quando você quiser.',
                        ts: agora - dia
                    }
                ]
            }
        ]
    };
}

function lerChat() {
    try {
        const chat = JSON.parse(localStorage.getItem(CHAT_KEY));
        if (chat && Array.isArray(chat.contatos)) {
            return chat;
        }
    } catch {
        /* dados corrompidos: recomeça com os exemplos */
    }

    const chat = semente();
    salvarChat(chat);
    return chat;
}

/* Adiciona o proprietário aos contatos (se ainda não estiver) e registra a primeira mensagem */
function adicionarContato(id, imovel, mensagem) {
    const chat = lerChat();
    let contato = chat.contatos.find(c => c.id === id);
    const novo = !contato;

    if (novo) {
        contato = { id, ...DONOS[id], naoLidas: 0, aguardando: false, msgs: [] };
        chat.contatos.unshift(contato);
    }

    if (novo || !contato.imovel || contato.imovel.idx !== imovel.idx) {
        contato.imovel = imovel;
        contato.msgs.push({ de: 'eu', texto: mensagem, ts: Date.now() });
        contato.aguardando = contato.status === 'online';
    }

    salvarChat(chat);
    return contato;
}
