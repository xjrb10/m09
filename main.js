function Card(denomination, color) {
    this.denomination = denomination;
    this.color = color;
    this.newColor = null;

    this.toString = function () {
        if (this.color === "any") {
            if (this.newColor === null){
                return `${this.color} ${this.denomination} (undecided color)`
            }
            return `${this.color} ${this.denomination} (color: ${this.newColor})`
        }
        return `${this.color} ${this.denomination}`
    }
    this.canPlaceOn = function (other_card) {
        return this.color === "any" || this.color === other_card.color || this.color === other_card.newColor || this.denomination === other_card.denomination;
    }
}

const suites = ["red", "yellow", "green", "blue"];
let deck = [];
let table = [];
for (let suite in suites) {
    for (let i = 0; i <= 9; i++) {
        deck.push(new Card(i.toString(), suites[suite]));
    }
    for (let i = 1; i <= 9; i++) {
        deck.push(new Card(i.toString(), suites[suite]));
    }
    for (let i = 0; i < 2; i++) {
        deck.push(new Card("skip", suites[suite]));
        deck.push(new Card("reverse", suites[suite]));
        deck.push(new Card("+2", suites[suite]));
    }
    deck.push(new Card("wild", "any"));
    deck.push(new Card("wild+4", "any"));
}
console.assert(deck.length === 108, `Initial deck count is ${deck.length}`);

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

do {
    shuffle(deck);
} while (deck[deck.length - 1].color === "any");
table.unshift(deck.pop());

// rules:
//  take from top of deck (pop from 0) if the player:
//    - does not have a matching color,
//    - does not have a matching number,
//    - receives a collected +4 or +2

function tryTakeCard() { // undefined if the deck is empty... we ran out of cards
    if (deck.length < 1 && table.length > 2) {
        let toReshuffle = table.splice(1);
        shuffle(toReshuffle);
        toReshuffle.forEach(reuseCard => {
            if (reuseCard.color === "any") {
                reuseCard.newColor = null;
            }
            deck.unshift(reuseCard)
        });
    }
    return deck.shift();
}

function takeCardTillValid(player) {
    const currentCard = table[0];
    let takenCard;
    do {
        takenCard = tryTakeCard();
        if (takenCard === undefined) break;
        player.player_deck.push(takenCard);
        console.log(`${player.name} takes ${takenCard}`);
    } while (!takenCard.canPlaceOn(currentCard));
    if (takenCard !== undefined) {
        console.log(`${player.name} placed down ${takenCard}`);
        table.unshift(player.player_deck.pop());
    }
    return takenCard;
}

function AIPlayer(name, player_deck) {
    this.name = name;
    this.player_deck = player_deck;

    this.toString = function () {
        return `${this.name} Cards: ${this.player_deck}`
    }

    this.get_move = function () {
        const currentCard = table[0];
        this.player_deck.sort((a, b) => {
            if (
                (currentCard.denomination === "+2" || currentCard.denomination === "wild+4") &&
                (a.denomination === "+2" || a.denomination === "wild+4")
            ) {
                return Infinity * ((currentCard.denomination !== "+2" && currentCard.denomination !== "wild+4") ? -1 : 1);
            }
            if (a.color === currentCard.color || a.denomination === currentCard.denomination) {
                return -Infinity;
            }
            if (a.color === "any" && b.color !== "any") {
                return 1;
            }
            return 0;
        });
        console.log(`Current card: ${currentCard}`)
        console.log(`${this.name} cards: ${this.player_deck}`)
        for (let i in this.player_deck) {
            if (this.player_deck[i].canPlaceOn(currentCard)) {
                const toPlace = this.player_deck.splice(i, 1)[0];
                if (toPlace.color === "any") {
                    toPlace.newColor = suites[Math.floor(Math.random() * suites.length)]
                }
                console.log(`${this.name} placed down ${toPlace}`);
                table.unshift(toPlace);
                return;
            }
        }
        let placed = takeCardTillValid(this);
        if (placed !== undefined && placed.color === "any") {
            placed.newColor = suites[Math.floor(Math.random() * suites.length)]
        }
    }
}

function askForColor(player, curCard){
    const currentCard = table[0];
    while (true) {
        const chosenColor = prompt(`Choose a color for ${curCard}, current card is: ${currentCard}.\n\nColors: ${suites}`);
        if (!suites.includes(chosenColor.toLowerCase())){
            alert("Invalid color!");
            continue;
        }
        curCard.newColor = chosenColor.toLowerCase();
        if (!curCard.canPlaceOn(currentCard)) {
            alert(`You cannot place down ${curCard} on ${currentCard}!`)
            continue;
        }
        return;
    }
}

function Player(name, player_deck) {
    this.name = name;
    this.player_deck = player_deck;

    this.toString = function () {
        return `${this.name} Cards: ${this.player_deck}`
    }

    this.get_move = function () {
        let placed = false;
        do {
            const currentCard = table[0];
            const reply = prompt(`Choose a card to place down! \n\nCurrent card: ${currentCard}\nYour ${this.player_deck.length} cards are: ${this.player_deck}\n\nEnter 'take' to pull cards until a valid card is chosen`)

            if (reply.toLowerCase() === "take") {
                const initialDeck = [...this.player_deck];
                const placedCard = takeCardTillValid(this);
                let difference = this.player_deck.filter(x => !initialDeck.includes(x));

                if (placedCard !== undefined && placedCard.color === "any") {
                    placedCard.newColor = suites[Math.floor(Math.random() * suites.length)]
                } else {
                    placed = true;
                }
                if (difference.length < 1){
                    alert(`You received ${placedCard}, but placed it down.`)
                } else {
                    alert(`You received ${difference.length} cards: ${difference}`)
                }
            }

            for (let i = 0; i < this.player_deck.length; i++) {
                const curCard = this.player_deck[i];
                if (curCard.toString().toLowerCase() === reply.toLowerCase()) {
                    if (!curCard.canPlaceOn(currentCard)) {
                        alert(`You cannot place down ${curCard} on ${currentCard}!`)
                        break;
                    }
                    table.unshift(this.player_deck.splice(i, 1)[0]);
                    placed = true;
                    break;
                }
                if (reply.toLowerCase().startsWith("any") && reply.toLowerCase().includes(curCard.denomination)) {
                    askForColor(this, curCard);
                    table.unshift(this.player_deck.splice(i, 1)[0]);
                }
            }
        } while (!placed);
    }
}

let players = [new Player("Player", []), new AIPlayer("AI_1", []), new AIPlayer("AI_2", []), new AIPlayer("AI_3", [])];
for (let i = 0; i < 7; i++) {
    for (let j in players) {
        players[j].player_deck.push(deck.pop())
    }
}

console.log(players)
let direction = 1;
let cardsWaitingToBePulled = 0;
for (let i = 0; players.length > 1; i += direction) {
    if (i >= players.length) {
        i = 0;
    }
    if (i < 0) {
        i = players.length - 1;
    }
    players[i].get_move();
    const placed = table[0];
    if (placed.denomination === "+2") {
        cardsWaitingToBePulled += 2;
    } else if (placed.denomination === "wild+4") {
        cardsWaitingToBePulled += 4;
    } else if (cardsWaitingToBePulled > 0) {
        console.log(`RELEASING +${cardsWaitingToBePulled} TO ${players[i].name}`);
        for (let j = 0; j < cardsWaitingToBePulled; j++) {
            const takenCard = tryTakeCard();
            if (takenCard === undefined) {
                continue;
            }
            players[i].player_deck.push(takenCard);
            console.log(`${players[i].name} takes ${takenCard}`);
        }
        cardsWaitingToBePulled = 0;
    }
    if (players[i].player_deck.length < 1) {
        console.log(`${players[i].name}: UNO!`);
        shuffle(players[i].player_deck);
        deck.push(...players[i].player_deck);
        delete players[i];
        players = players.filter(_ => _);
    }
    switch (table[0].denomination) {
        case "reverse":
            direction *= -1;
            break;
        case "skip":
            i += direction;
            break;
    }
}
console.log(`Loser: ${players}`)
