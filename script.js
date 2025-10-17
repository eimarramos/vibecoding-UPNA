// --- NUEVA LÓGICA DE EQUIPOS Y COMBATE ---
const GEN1_COUNT = 151;
const MAX_TEAM = 6;
const API_URL = 'https://pokeapi.co/api/v2/pokemon/';
let playerTeam = [];
let cpuTeam = [];
let playerPokemon = null;
let enemyPokemon = null;
let playerStats = null;
let enemyStats = null;
let battleEnded = false;
let playerIdx = 0;
let cpuIdx = 0;

async function fetchPokemon(name) {
    const res = await fetch(API_URL + name);
    const data = await res.json();
    const moves = data.moves.slice(0, 4).map(m => m.move.name);
    return {
        name: data.name,
        sprite: data.sprites.front_default,
        hp: data.stats[0].base_stat,
        attack: data.stats[1].base_stat,
        defense: data.stats[2].base_stat,
        type: data.types[0].type.name,
        moves: moves
    };
}

function renderPokemon(containerId, poke, isPlayer) {
    const container = document.getElementById(containerId);
    container.innerHTML = `
        <div class="pokemon-card ${isPlayer ? 'player' : 'enemy'}">
            <img src="${poke.sprite}" alt="${poke.name}" class="poke-img" style="width:100px">
            <h3>${poke.name.charAt(0).toUpperCase() + poke.name.slice(1)}</h3>
            <p>Tipo: ${poke.type}</p>
            <p>HP: <span id="${isPlayer ? 'player-hp' : 'enemy-hp'}">${poke.hp}</span></p>
        </div>
    `;
}

function renderMoves(moves) {
    const moveSelect = document.getElementById('move-select');
    moveSelect.innerHTML = '';
    moves.forEach((move, i) => {
        const btn = document.createElement('button');
        btn.className = 'move-btn';
        btn.innerText = move.replace(/-/g, ' ');
        btn.onclick = () => attack(move);
        btn.id = 'move-btn-' + i;
        moveSelect.appendChild(btn);
    });
}

function attack(moveName) {
    if (battleEnded) return;
    document.querySelectorAll('.move-btn').forEach(btn => btn.disabled = true);
    const playerImg = document.querySelector('#player-pokemon .poke-img');
    const enemyImg = document.querySelector('#enemy-pokemon .poke-img');
    playerImg.classList.add('attack-anim');
    setTimeout(() => {
        playerImg.classList.remove('attack-anim');
        enemyImg.classList.add('hit-anim');
        setTimeout(() => {
            enemyImg.classList.remove('hit-anim');
            let playerDamage = Math.max(1, playerStats.attack - enemyStats.defense/2 + Math.floor(Math.random()*5));
            let enemyDamage = Math.max(1, enemyStats.attack - playerStats.defense/2 + Math.floor(Math.random()*5));
            enemyStats.hp -= playerDamage;
            playerStats.hp -= enemyDamage;
            document.getElementById('player-hp').innerText = Math.max(0, playerStats.hp);
            document.getElementById('enemy-hp').innerText = Math.max(0, enemyStats.hp);
            let log = `Tu Pokémon usa ${moveName.replace(/-/g, ' ')} y hace ${playerDamage} de daño.\nEl enemigo hace ${enemyDamage} de daño.`;
            // KO del rival
            if (enemyStats.hp <= 0 && playerStats.hp > 0) {
                cpuIdx++;
                if (cpuIdx < cpuTeam.length) {
                    log += `\n¡El rival cambia a ${capitalize(cpuTeam[cpuIdx].name)}!`;
                    nextPokemon(false);
                } else {
                    log += '\n¡Has ganado el combate!';
                    battleEnded = true;
                    document.getElementById('restart-btn').style.display = 'inline-block';
                }
            }
            // KO del jugador
            else if (playerStats.hp <= 0 && enemyStats.hp > 0) {
                playerIdx++;
                if (playerIdx < playerTeam.length) {
                    log += `\n¡Tú cambias a ${capitalize(playerTeam[playerIdx].name)}!`;
                    nextPokemon(true);
                } else {
                    log += '\n¡Has perdido el combate!';
                    battleEnded = true;
                    document.getElementById('restart-btn').style.display = 'inline-block';
                }
            }
            // KO de ambos
            else if (playerStats.hp <= 0 && enemyStats.hp <= 0) {
                playerIdx++;
                cpuIdx++;
                if (playerIdx < playerTeam.length && cpuIdx < cpuTeam.length) {
                    log += `\n¡Ambos cambian de Pokémon!`;
                    nextPokemon(true);
                    nextPokemon(false);
                } else if (playerIdx >= playerTeam.length && cpuIdx >= cpuTeam.length) {
                    log += '\n¡Empate!';
                    battleEnded = true;
                    document.getElementById('restart-btn').style.display = 'inline-block';
                } else if (playerIdx >= playerTeam.length) {
                    log += '\n¡Has perdido el combate!';
                    battleEnded = true;
                    document.getElementById('restart-btn').style.display = 'inline-block';
                } else {
                    log += '\n¡Has ganado el combate!';
                    battleEnded = true;
                    document.getElementById('restart-btn').style.display = 'inline-block';
                }
            }
            document.getElementById('battle-log').innerText = log;
            if (!battleEnded && enemyStats.hp > 0 && playerStats.hp > 0) {
                enemyImg.classList.add('attack-anim');
                setTimeout(() => {
                    enemyImg.classList.remove('attack-anim');
                    playerImg.classList.add('hit-anim');
                    setTimeout(() => {
                        playerImg.classList.remove('hit-anim');
                        if (!battleEnded) {
                            document.querySelectorAll('.move-btn').forEach(btn => btn.disabled = false);
                        }
                    }, 300);
                }, 300);
            } else {
                document.querySelectorAll('.move-btn').forEach(btn => btn.disabled = true);
            }
        }, 300);
    }, 300);
}

function nextPokemon(isPlayer) {
    setTimeout(async () => {
        let log = document.getElementById('battle-log').innerText;
        if (isPlayer) {
            playerPokemon = await fetchPokemon(playerTeam[playerIdx].name);
            playerStats = { ...playerPokemon };
            renderPokemon('player-pokemon', playerPokemon, true);
            renderMoves(playerPokemon.moves);
            document.querySelectorAll('.move-btn').forEach(btn => btn.disabled = false);
            log += `\n¡Entra ${capitalize(playerTeam[playerIdx].name)}!`;
        } else {
            enemyPokemon = await fetchPokemon(cpuTeam[cpuIdx].name);
            enemyStats = { ...enemyPokemon };
            renderPokemon('enemy-pokemon', enemyPokemon, false);
            log += `\n¡Entra ${capitalize(cpuTeam[cpuIdx].name)}!`;
        }
        document.getElementById('battle-log').innerText = log;
    }, 700);
}

function addToTeam(name, id) {
    if (playerTeam.length >= MAX_TEAM) return;
    if (playerTeam.find(p => p.name === name)) return;
    playerTeam.push({ name, id });
    renderTeams();
    document.getElementById('start-battle-btn').disabled = playerTeam.length !== MAX_TEAM;
}

function removeFromTeam(idx) {
    playerTeam.splice(idx, 1);
    renderTeams();
    document.getElementById('start-battle-btn').disabled = playerTeam.length !== MAX_TEAM;
}

function renderTeams() {
    const playerList = document.getElementById('player-team');
    playerList.innerHTML = '';
    playerTeam.forEach((poke, idx) => {
        const pokeDiv = document.createElement('div');
        pokeDiv.className = 'team-poke';
        pokeDiv.innerHTML = `<img src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${poke.id}.png' alt='${poke.name}'><button class='remove-btn' title='Quitar'>&times;</button>`;
        pokeDiv.querySelector('.remove-btn').onclick = (e) => {
            e.stopPropagation();
            removeFromTeam(idx);
        };
        playerList.appendChild(pokeDiv);
    });
    const cpuList = document.getElementById('cpu-team');
    cpuList.innerHTML = '';
    cpuTeam.forEach((poke) => {
        const pokeDiv = document.createElement('div');
        pokeDiv.className = 'team-poke';
        pokeDiv.innerHTML = `<img src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${poke.id}.png' alt='${poke.name}'>`;
        cpuList.appendChild(pokeDiv);
    });
}

function startBattle() {
    const allIds = Array.from({length: GEN1_COUNT}, (_, i) => i+1);
    const availableIds = allIds.filter(id => !playerTeam.some(p => p.id === id));
    cpuTeam = [];
    while (cpuTeam.length < MAX_TEAM) {
        const idx = Math.floor(Math.random() * availableIds.length);
        const id = availableIds[idx];
        const name = getPokemonNameById(id);
        cpuTeam.push({ name, id });
        availableIds.splice(idx, 1);
    }
    renderTeams();
    playerIdx = 0;
    cpuIdx = 0;
    selectPokemon(playerTeam[playerIdx].name, cpuTeam[cpuIdx].name);
}

async function selectPokemon(playerName, cpuName) {
    playerPokemon = await fetchPokemon(playerName);
    playerStats = { ...playerPokemon };
    enemyPokemon = await fetchPokemon(cpuName);
    enemyStats = { ...enemyPokemon };
    document.getElementById('pokemon-select').style.display = 'none';
    document.getElementById('battle-area').style.display = 'block';
    renderPokemon('player-pokemon', playerPokemon, true);
    renderPokemon('enemy-pokemon', enemyPokemon, false);
    renderMoves(playerPokemon.moves);
    document.getElementById('battle-log').innerText = '¡El combate comienza!';
    battleEnded = false;
    document.getElementById('restart-btn').style.display = 'none';
}

window.onload = function() {
    const grid = document.getElementById('smash-grid');
    for (let i = 1; i <= GEN1_COUNT; i++) {
        const pokeName = getPokemonNameById(i);
        const pokeDiv = document.createElement('div');
        pokeDiv.className = 'smash-poke';
        pokeDiv.innerHTML = `<img src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${i}.png' alt='${pokeName}'><div>${capitalize(pokeName)}</div>`;
        pokeDiv.onclick = () => addToTeam(pokeName, i);
        grid.appendChild(pokeDiv);
    }
    document.getElementById('start-battle-btn').onclick = startBattle;
    document.getElementById('restart-btn').onclick = () => {
        document.getElementById('battle-area').style.display = 'none';
        document.getElementById('pokemon-select').style.display = 'block';
        document.getElementById('battle-log').innerText = '';
        document.getElementById('move-select').innerHTML = '';
        playerTeam = [];
        cpuTeam = [];
        playerIdx = 0;
        cpuIdx = 0;
        renderTeams();
        document.getElementById('start-battle-btn').disabled = true;
    };
    renderTeams();
};

function getPokemonNameById(id) {
    const names = [
        'bulbasaur','ivysaur','venusaur','charmander','charmeleon','charizard','squirtle','wartortle','blastoise','caterpie','metapod','butterfree','weedle','kakuna','beedrill','pidgey','pidgeotto','pidgeot','rattata','raticate','spearow','fearow','ekans','arbok','pikachu','raichu','sandshrew','sandslash','nidoran-f','nidorina','nidoqueen','nidoran-m','nidorino','nidoking','clefairy','clefable','vulpix','ninetales','jigglypuff','wigglytuff','zubat','golbat','oddish','gloom','vileplume','paras','parasect','venonat','venomoth','diglett','dugtrio','meowth','persian','psyduck','golduck','mankey','primeape','growlithe','arcanine','poliwag','poliwhirl','poliwrath','abra','kadabra','alakazam','machop','machoke','machamp','bellsprout','weepinbell','victreebel','tentacool','tentacruel','geodude','graveler','golem','ponyta','rapidash','slowpoke','slowbro','magnemite','magneton','farfetchd','doduo','dodrio','seel','dewgong','grimer','muk','shellder','cloyster','gastly','haunter','gengar','onix','drowzee','hypno','krabby','kingler','voltorb','electrode','exeggcute','exeggutor','cubone','marowak','hitmonlee','hitmonchan','lickitung','koffing','weezing','rhyhorn','rhydon','chansey','tangela','kangaskhan','horsea','seadra','goldeen','seaking','staryu','starmie','mr-mime','scyther','jynx','electabuzz','magmar','pinsir','tauros','magikarp','gyarados','lapras','ditto','eevee','vaporeon','jolteon','flareon','porygon','omanyte','omastar','kabuto','kabutops','aerodactyl','snorlax','articuno','zapdos','moltres','dratini','dragonair','dragonite','mewtwo','mew'
    ];
    return names[id-1];
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
