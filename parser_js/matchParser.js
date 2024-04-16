export class MatchParser {
    static userMap = null;
    static beatmapMap = null;

    /**
     * Takes user input and writes to an excel file
     * @param {string} matchLinks A string containing matchLinks on each line
     * @param {string} users A string containing usernames and userIds on each line
     * @param {string} mapPool A string containing identifiers and mapIds on each line
     * @param {string} outputPath The directory where the output sheet should go
     * @param {boolean[]} settings Boolean array of the following settings in this order: [showScore, showAcc, showMods, emptyColumnBetweenMaps, showScoringType]
     * @returns {string} Success message
     */
    static parseMatch(matchLinks, users, mapPool, outputPath, settings) {
        const matchLinkList = matchLinks.split(/\r?\n/);
        MatchParser.userMap = MatchParser.stringToMap(users);
        MatchParser.beatmapMap = MatchParser.stringBeatmapToMap(mapPool);
        const isWhiteList = !MatchParser.userMap.isEmpty;

        for (const matchLink of matchLinkList) {
            const games = MatchParser.getGamesFromMatch(MatchParser.getMatchFromOsu(matchLink), isWhiteList);
            for (const game of games) {
                MatchParser.parseGame(game, settings[5]);
            }
        }

        MatchParser.writeToFile(outputPath, settings);
        return `You can find the sheet at: ${outputPath}/output.xlsx`;
    }

    /**
     * Takes a String and adds all of its lines to a map.
     * @param {string} inputString A string where each line consists of string1:string2
     * @returns {Map<string, string>} A map that maps string1 to string2
     */
    static stringToMap(inputString) {
        const outputMap = new Map();
        const lines = inputString.split(/\r?\n/);
        for (const line of lines) {
            const idToName = line.split(':');
            if (idToName.length > 1) {
                outputMap.set(idToName[1], idToName[0]);
            }
        }
        return outputMap;
    }

    /**
     * Takes a String and adds all of its lines to a map
     * @param {string} inputString A string where each line consists of string1:string2
     * @returns {Map<string, Beatmap>} A map that maps string1 to a Beatmap with name string2.
     */
    static stringBeatmapToMap(inputString) {
        const outputMap = new Map();
        const lines = inputString.split(/\r?\n/);
        for (const line of lines) {
            const idToName = line.split(':');
            if (idToName.length > 1) {
                outputMap.set(idToName[1], new Beatmap(idToName[0]));
            }
        }
        return outputMap;
    }

    /**
     * Takes a weblink, searches the match-JSON on the webpage, and returns it as JSONObject.
     * @param {string} matchLink A link to a webpage (an osu match)
     * @returns {JSONObject} A JSONObject containing all match-data
     * @throws {Exception}
     */
    static async getMatchFromOsu(matchLink) {
        if (!matchLink) {
            return null;
        }
        const response = await fetch(matchLink);
        const matchData = await response.json();
        return matchData;
    }

    /**
     * In Osu, one 'match' has multiple 'games', where every game is a round where all players play one beatmap
     * This method also adds all users to the userMap if there is no whitelist.
     * @param {JSONObject} o The JSONObject of the match
     * @param {boolean} isWhitelist
     * @returns {JSONObject[]} A list of games as JSONObjects
     */
    static getGamesFromMatch(o, isWhitelist) {
        if (!isWhitelist) {
            MatchParser.addUsersToMapFromJSON(o.users);
        }

        const games = [];
        for (const event of o.events) {
            if (event.hasOwnProperty('game')) {
                games.push(event.game);
            }
        }
        return games;
    }

    /**
     * Adds all users that played in a match to a map
     * @param {Object[]} users The JSONObject from a match containing all users
     */
    static addUsersToMapFromJSON(users) {
        for (const user of users) {
            const userId = user.id.toString();
            const userName = user.username.toString();
            if (!MatchParser.userMap.has(userId)) {
                MatchParser.userMap.set(userId, userName);
            }
        }
    }

    /**
     * Takes a 'game' and parses its JSON, it then puts the info into the Maps.
     * @param {JSONObject} game The JSONObject of the game
     */
    static parseGame(game, mapsOutsideOfPool) {
        const beatMapId = game.beatmap.id.toString();
        let beatmap = null;
        if (MatchParser.beatmapMap.has(beatMapId)) {
            beatmap = MatchParser.beatmapMap.get(beatMapId);
        } else {
            if (!mapsOutsideOfPool) {
                return;
            }
            beatmap = new Beatmap(beatMapId.toString());
            MatchParser.beatmapMap.set(beatMapId, beatmap);
        }

        for (const score of game.scores) {
            const scoringType = game.scoring_type.toString();
            const scorePoints = score.score.toString();
            const mods = score.mods.toString();
            const accuracy = score.accuracy.toString().replace('.', ',');

            const scoreObject = new Score(scoringType, scorePoints, mods, accuracy);

            const userId = score.user_id.toString();
            const user = MatchParser.userMap.get(userId);
            if (user !== null && user !== undefined) {
                beatmap.put(user, scoreObject);
            }
        }
    }

    /**
     * @param {string} path The directory where the output sheet should go
     * @param {boolean[]} settings boolean array of the following settings in this order: [showScore, showAcc, showMods, emptyColumnBetweenMaps, showScoringType]
     */
    static async writeToFile(path, settings) {
        const workbook = new XSSFWorkbook();
        const spreadsheet = workbook.createSheet('Users');
        let row;
        const mapIds = [...MatchParser.beatmapMap.keys()];
        const userNames = [...MatchParser.userMap.keys()];

        let rowid = 0;
        row = spreadsheet.createRow(rowid++);
        row.createCell(0).setCellValue('Naam');
        let cellid = 1;
        for (const beatmapKey of mapIds) { // For every beatmap
            row.createCell(cellid).setCellValue(MatchParser.beatmapMap.get(beatmapKey).getName());
            cellid += booleanSum(settings);
        }
        for (const key of userNames) { // For every user
            row = spreadsheet.createRow(rowid++);
            cellid = 0;
            row.createCell(cellid++).setCellValue(MatchParser.userMap.get(key));
            for (const beatmapKey of mapIds) { // For every beatmap
                const score = MatchParser.beatmapMap.get(beatmapKey).get(MatchParser.userMap.get(key));
                if (settings[0]) {
                    row.createCell(cellid++).setCellValue(score.getScorePoints());
                }
                if (settings[1]) {
                    row.createCell(cellid++).setCellValue(score.getAccuracy());
                }
                if (settings[2]) {
                    row.createCell(cellid++).setCellValue(score.getMods());
                }
                if (settings[4]) {
                    row.createCell(cellid++).setCellValue(score.getScoringType());
                }
                if (settings[3]) { // Careful! 3 goes after 4...
                    row.createCell(cellid++);
                }
            }
        }

        const response = await fetch(path + '/output.xlsx', {
            method: 'POST',
            body: workbook.write()
        });
        const responseBody = await response.text();
        console.log(responseBody);
    }

    /**
     * @param {boolean[]} booleans
     * @returns {number}
     */
    static booleanSum(booleans) {
        let sum = 0;
        for (const b of booleans) {
            if (b) {
                sum++;
            }
        }
        return sum;
    }
}