class LiveGames {
    constructor () {
        this.games = [];
    }
    
    //First name is a hack to prevent situation wherein user does not get question and answers to his/her view.
    addGame(pin, hostId, gameLive, gameData, firstQuestion){
        var game = {pin, hostId, gameLive, gameData, firstQuestion};
        this.games.push(game);
        return game;
    }
    removeGame(hostId){
        var game = this.getGame(hostId);
        
        if(game){
            this.games = this.games.filter((game) => game.hostId !== hostId);
        }
        return game;
    }
    getGame(hostId){
        return this.games.filter((game) => game.hostId === hostId)[0]
    }
}

module.exports = {LiveGames};