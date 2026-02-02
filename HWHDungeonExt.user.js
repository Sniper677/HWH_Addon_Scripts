// ==UserScript==
// @name            HWHDungeonExt
// @name:en         HWHDungeonExt
// @name:ru         HWHDungeonExt
// @namespace       HWHDungeonExt
// @version         0.2.1.0
// @description     Extension for HeroWarsHelper script
// @description:en  Extension for HeroWarsHelper script
// @description:ru  Расширение для скрипта HeroWarsHelper
// @author          ZingerY, Sniper677
// @license         Copyright ZingerY, Sniper677
// @homepage        https://github.com/Sniper677/HWH_Addon_Scripts
// @icon            https://cdn0.iconfinder.com/data/icons/superheros-1/512/Superheroes-04-512.png
// @match           https://www.hero-wars.com/*
// @match           https://apps-1701433570146040.apps.fbsbx.com/*
// @run-at          document-start
// @downloadURL     https://github.com/Sniper677/HWH_Addon_Scripts/raw/refs/heads/main/HWHDungeonExt.user.js
// @updateURL       https://github.com/Sniper677/HWH_Addon_Scripts/raw/refs/heads/main/meta/HWHDungeonExt.meta.js
// ==/UserScript==

(function () {

    if (!this.HWHClasses) {
        console.log('%cObject for extension not found', 'color: red');
        return;
    }

    console.log('%cStart Extension ' + GM_info.script.name + ', v' + GM_info.script.version + ' by ' + GM_info.script.author, 'color: red');

    const { addExtentionName } = HWHFuncs;

    addExtentionName(GM_info.script.name, GM_info.script.version, GM_info.script.author);

    const {
        getInput,
        setProgress,
        hideProgress,
        I18N,
        send,
        getTimer,
        countdownTimer,
        getUserInfo,
        getSaveVal,
        setSaveVal,
        popup,
        setIsCancalBattle,
        random
    } = HWHFuncs;

    let { buttons, i18nLangData } = HWHData;

    const i18nLangDataEn = {
        HWHDE: `${GM_info.script.name}`,
        HWHDE_BTN: 'Dungeon Stop',
        HWHDE_BTN_TITLE: 'Stops dungeon farming',
        HWHDE_STOPPED: `${GM_info.script.name} stopped`,
        HWHDE_STOPPED_MANUALLY: `${GM_info.script.name} manually stopped`,
        HWHDE_COMPLETED: `${GM_info.script.name} completed`,
        HWHDE_TITANITE: 'Titanite',
        HWHDE_SRV_CON_LOST: 'Connection to server lost',
    };
    const i18nLangDataRu = {
        HWHDE: `${GM_info.script.name}`,
        HWHDE_BTN: 'Подземелье Стоп',
        HWHDE_BTN_TITLE: 'Останавливает фарм подземелий',
        HWHDE_STOPPED: 'Подземелье остановлено',
        HWHDE_STOPPED_MANUALLY: 'Подземелье остановлено вручную',
        HWHDE_COMPLETED: 'Подземелье завершено',
        HWHDE_TITANITE: 'Титанит',
        HWHDE_SRV_CON_LOST: 'Соединение с сервером потеряно',
    };
    i18nLangData['en'] = Object.assign(i18nLangData['en'], i18nLangDataEn);
    i18nLangData['ru'] = Object.assign(i18nLangData['ru'], i18nLangDataRu);

    const stopDungeonButton = {
        stopDungeonButton: {
            get name() { return I18N('HWHDE_BTN'); },
            get title() { return I18N('HWHDE_BTN_TITLE'); },
            onClick: stopDungeon,
            hide: false,
            color: 'red'
        }
    }

    Object.assign(buttons, stopDungeonButton)
    this.HWHData.buttons = buttons;

    function stopDungeon(e) {
        stopDung = true;
    }

    function executeDungeon(resolve, reject) {
        let countPredictionCard = 0;
        let dungeonActivity = 0;
        let startDungeonActivity = 0;
        let maxDungeonActivity = 150;
        let limitDungeonActivity = 30180;
        let countShowTitanStats = 1;
        let showTitanStatsInterval = 10;
        let dungeonActivityPB = `<span style="color: white;">${dungeonActivity}</span>`;
        let maxDungeonActivityPB = `<span style="color: orange;">${maxDungeonActivity}</span>`;
        //let fastMode = isChecked('fastMode');
        let end = false;

        const colors = {
            water: 'color: #3498db;',
            fire: 'color: #e74c3c;',
            earth: 'color: #2ecc71;',
            light: 'color: #f1c40f;',
            dark: 'color: #9b59b6;',
            neutral: 'color: yellow;',
            green: 'color: #0b0;',
            none: 'color: none;',
            red: 'color: #d00;',
        };

        let countTeam = [];
        let timeDungeon = {
            all: new Date().getTime(),
            findAttack: 0,
            attackNeutral: 0,
            attackEarthOrFire: 0,
        };
        let dungeonGetInfo = {};
        let titansStates = {};
        let bestBattle = {};

        let teams = {
            neutral: [],
            water: [],
            earth: [],
            fire: [],
            hero: [],
        };

        let talentMsg = '';
        let talentMsgReward = '';

        let callsExecuteDungeon = {
            calls: [{
                name: 'dungeonGetInfo',
                args: {},
                ident: 'dungeonGetInfo',
            }, {
                name: 'teamGetAll',
                args: {},
                ident: 'teamGetAll',
            }, {
                name: 'teamGetFavor',
                args: {},
                ident: 'teamGetFavor',
            }, {
                name: 'clanGetInfo',
                args: {},
                ident: 'clanGetInfo',
            }, {
                name: 'inventoryGet',
                args: {},
                ident: 'inventoryGet',
            }, {
                name: 'titanGetAll',
                args: {},
                ident: 'titanGetAll',
            }, ],
        };
        this.start = async function (titanite) {
            //maxDungeonActivity = titanite > limitDungeonActivity ? limitDungeonActivity : titanite;
            maxDungeonActivity = titanite || getInput('countTitanit');
            maxDungeonActivityPB = `<span style="color: orange;">${maxDungeonActivity}</span>`;
            send(JSON.stringify(callsExecuteDungeon), startDungeon);
        };

        /** Retrieve dungeon data */
        function startDungeon(e) {
            stopDung = false;
            // stop dungeon
            let res = e.results;
            dungeonGetInfo = res[0].result.response;
            if (!dungeonGetInfo) {
                endDungeon('noDungeon', res);
                return;
            }
            console.log('Start farming the dungeon: ', new Date());
            let teamGetAll = res[1].result.response;
            let teamGetFavor = res[2].result.response;
            dungeonActivity = res[3].result.response.stat.todayDungeonActivity;
            dungeonActivityPB = `<span style="color: white;">${dungeonActivity}</span>`;
            startDungeonActivity = res[3].result.response.stat.todayDungeonActivity;
            countPredictionCard = res[4].result.response.consumable[81];
            titanGetAll = res[5].result.response;
            // Merge existing states with new data to prevent losing titans on restart
            titansStates = Object.assign(titansStates || {}, dungeonGetInfo.states.titans);
            teams.hero = {
                favor: teamGetFavor.dungeon_hero,
                heroes: teamGetAll.dungeon_hero.filter((id) => id < 6000),
                teamNum: 0,
            };
            let heroPet = teamGetAll.dungeon_hero.filter((id) => id >= 6000).pop();
            if (heroPet) {
                teams.hero.pet = heroPet;
            }
            teams.neutral = getTitanTeam('neutral');
            teams.water = {
                favor: {},
                heroes: getTitanTeam('water'),
                teamNum: 0,
            };
            teams.earth = {
                favor: {},
                heroes: getTitanTeam('earth'),
                teamNum: 0,
            };
            teams.fire = {
                favor: {},
                heroes: getTitanTeam('fire'),
                teamNum: 0,
            };

            checkFloor(dungeonGetInfo);
        }

        function getTitanTeam(type) {
            switch (type) {
                case 'neutral':
                    /**
                       4023: Eden, 4022: Avalon, 4012: Ignis, 4021: Sylva, 4011: Vulcan, 4010: Moloch, 4020: Angus
                     */
                    return [4023, 4022, 4012, 4021, 4011, 4010, 4020];
                case 'water':
                    return [4000, 4001, 4002, 4003].filter((e) => !titansStates[e]?.isDead);
                case 'fire':
                    /**
                        Disabled Asherona as she loses HP too quickly and auto run stops again and again.
                    */
                    //return [4010, 4011, 4012, 4013, 4014].filter((e) => !titansStates[e]?.isDead);
                    return [4010, 4011, 4012, 4013].filter((e) => !titansStates[e]?.isDead);
                case 'earth':
                    /**
                        Disabled Verdoc as he loses HP too quickly and auto run stops again and again.
                    */
                    //return [4020, 4021, 4022, 4023, 4024].filter((e) => !titansStates[e]?.isDead);
                    return [4020, 4021, 4022, 4023].filter((e) => !titansStates[e]?.isDead);
            }
        }

        /** Create object copy */
        function clone(a) {
            return JSON.parse(JSON.stringify(a));
        }

        /** Find floor element */
        function findElement(floor, element) {
            for (let i in floor) {
                if (floor[i].attackerType === element) {
                    return i;
                }
            }
            return undefined;
        }

        /** Checking floor */
        async function checkFloor(dungeonInfo) {
            if (!('floor' in dungeonInfo) || dungeonInfo.floor?.state == 2) {
                saveProgress();
                return;
            }
            checkTalent(dungeonInfo);
            // console.log(dungeonInfo, dungeonActivity);
            maxDungeonActivity = getInput('countTitanit');
            maxDungeonActivityPB = `<span style="color: orange;">${maxDungeonActivity}</span>`;
            setProgress(`${I18N('HWHDE')}: ${I18N('HWHDE_TITANITE')} ${dungeonActivityPB}/${maxDungeonActivityPB} ${talentMsg}`, false, stopDungeon);
            if (dungeonActivity >= maxDungeonActivity) {
                endDungeon('Stop dungeon,', 'Titanite gained: ' + dungeonActivity + '/' + maxDungeonActivity);
                return;
            }
            let activity = dungeonActivity - startDungeonActivity;
            titansStates = dungeonInfo.states.titans;
            if (stopDung) {
                endDungeon('Stop dungeon,', 'Titanite gained: ' + dungeonActivity + '/' + maxDungeonActivity);
                return;
            }
            /*if (activity / 1000 > countShowTitanStats) {
                    countShowTitanStats++;
                    showTitanStats();
            }*/
            if (dungeonInfo.floorNumber % showTitanStatsInterval === 0) {
                showTitanStats();
            }

            bestBattle = {};
            let floorChoices = dungeonInfo.floor.userData;
            if (floorChoices.length > 1) {
                for (let element in teams) {
                    let teamNum = findElement(floorChoices, element);
                    if (!!teamNum) {
                        if (element == 'earth') {
                            teamNum = await chooseEarthOrFire(floorChoices);
                            if (teamNum < 0) {
                                endDungeon('It is impossible to win without losing a titan!', dungeonInfo);
                                return;
                            }
                        }
                        chooseElement(floorChoices[teamNum].attackerType, teamNum);
                        return;
                    }
                }
            } else {
                chooseElement(floorChoices[0].attackerType, 0);
            }
        }

        /** test turtle talent */
        async function checkTalent(dungeonInfo) {
            const talent = dungeonInfo.talent;
            if (!talent) {
                return;
            }
            const dungeonFloor = +dungeonInfo.floorNumber;
            const talentFloor = +talent.floorRandValue;
            let doorsAmount = 3 - talent.conditions.doorsAmount;
            if (dungeonFloor === talentFloor && (!doorsAmount || !talent.conditions?.farmedDoors[dungeonFloor])) {
                const reward = await Send({
                    calls: [
                        { name: 'heroTalent_getReward', args: { talentType: 'tmntDungeonTalent', reroll: false }, ident: 'group_0_body' },
                        { name: 'heroTalent_farmReward', args: { talentType: 'tmntDungeonTalent' }, ident: 'group_1_body' },
                    ],
                }).then((e) => e.results[0].result.response);
                const type = Object.keys(reward).pop();
                const itemId = Object.keys(reward[type]).pop();
                const count = reward[type][itemId];
                const itemName = cheats.translate(`LIB_${type.toUpperCase()}_NAME_${itemId}`);
                talentMsgReward += `<br>• <span style="color: white;">${itemName} (<span style="color: cyan;">x${count}</span>)</span>`;
                doorsAmount++;
            }
            talentMsg = `<br>TMNT Talent: ${doorsAmount}/3 ${talentMsgReward}<br>`;
        }

        /** Choose to attack with fire or earth */
        async function chooseEarthOrFire(floorChoices) {
            bestBattle.recovery = -11;
            let selectedTeamNum = -1;
            for (let attempt = 0; selectedTeamNum < 0 && attempt < 4; attempt++) {
                for (let teamNum in floorChoices) {
                    let attackerType = floorChoices[teamNum].attackerType;
                    selectedTeamNum = await attemptAttackEarthOrFire(teamNum, attackerType, attempt);
                }
            }
            console.log('Select Fire or Earth Team: ', selectedTeamNum < 0 ? 'not done' : floorChoices[selectedTeamNum].attackerType);
            return selectedTeamNum;
        }

        /** Attempt to attack with earth and fire */
        async function attemptAttackEarthOrFire(teamNum, attackerType, attempt) {
            let start = new Date();
            let team = clone(teams[attackerType]);
            let startIndex = team.heroes.length + attempt - 4;
            if (startIndex >= 0) {
                team.heroes = team.heroes.slice(startIndex);
                let recovery = await getBestRecovery(teamNum, attackerType, team, 25);
                if (recovery > bestBattle.recovery) {
                    bestBattle.recovery = recovery;
                    bestBattle.selectedTeamNum = teamNum;
                    bestBattle.team = team;
                }
            }
            let workTime = new Date().getTime() - start.getTime();
            timeDungeon.attackEarthOrFire += workTime;
            if (bestBattle.recovery < -10) {
                return -1;
            }
            return bestBattle.selectedTeamNum;
        }

        /** Select element for attack */
        async function chooseElement(attackerType, teamNum) {
            let result;
            const currentTeam = teams[attackerType];

            switch (attackerType) {
                case 'hero':
                case 'water':
                    result = await startBattle(teamNum, attackerType, teams[attackerType]);
                    break;
                case 'earth':
                case 'fire':
                    result = await attackEarthOrFire(teamNum, attackerType);
                    break;
                case 'neutral':
                    result = await attackNeutral(teamNum, attackerType);
                    break;
            }

            // Record the team usage for showFinalStats
            // If it's a specific titan team, record the hero IDs used
            if (currentTeam && currentTeam.heroes) {
                addTeam(currentTeam.heroes);
            } else if (attackerType === 'neutral' && bestBattle.attackers) {
                // For neutral battles, use the specific attackers chosen by the logic
                addTeam(Object.keys(bestBattle.attackers).map(Number));
            }

            if (!!result && attackerType != 'hero') {
                let recovery = (!!!bestBattle.recovery ? 10 * getRecovery(result) : bestBattle.recovery) * 100;
                let titans = result.progress[0].attackers.heroes;
                console.log('The battle was fought: ' + attackerType + ', recovery = ' + (recovery > 0 ? '+' : '') + Math.round(recovery) + '% \r\n', titans);
            }
            endBattle(result);
        }

        /** Attack with earth or fire */
        async function attackEarthOrFire(teamNum, attackerType) {
            if (!!!bestBattle.recovery) {
                bestBattle.recovery = -11;
                let selectedTeamNum = -1;
                for (let attempt = 0; selectedTeamNum < 0 && attempt < 4; attempt++) {
                    selectedTeamNum = await attemptAttackEarthOrFire(teamNum, attackerType, attempt);
                }
                if (selectedTeamNum < 0) {
                    endDungeon('It is impossible to win without losing a titan!', attackerType);
                    return;
                }
            }
            return findAttack(teamNum, attackerType, bestBattle.team);
        }

        /** Find suitable result for the attack */
        async function findAttack(teamNum, attackerType, team) {
            let start = new Date();
            let recovery = -1000;
            let iterations = 0;
            let result;
            let correction = 0.01;
            for (let needRecovery = bestBattle.recovery; recovery < needRecovery; needRecovery -= correction, iterations++) {
                result = await startBattle(teamNum, attackerType, team);
                recovery = getRecovery(result);
            }
            bestBattle.recovery = recovery;
            let workTime = new Date().getTime() - start.getTime();
            timeDungeon.findAttack += workTime;
            return result;
        }

        /** Attack with neutral team */
        async function attackNeutral(teamNum, attackerType) {
            let start = new Date();
            let factors = calcFactor();
            bestBattle.recovery = -0.2;
            await findBestBattleNeutral(teamNum, attackerType, factors, true);
            if (bestBattle.recovery < 0 || (bestBattle.recovery < 0.2 && factors[0].value < 0.5)) {
                let recovery = 100 * bestBattle.recovery;
                console.log('Could not find a successful fight in quick mode: ' + attackerType + ', recovery = ' + (recovery > 0 ? '+' : '') + Math.round(recovery) + '% \r\n', bestBattle.attackers);
                await findBestBattleNeutral(teamNum, attackerType, factors, false);
            }
            let workTime = new Date().getTime() - start.getTime();
            timeDungeon.attackNeutral += workTime;
            if (!!bestBattle.attackers) {
                let team = getTeam(bestBattle.attackers);
                return findAttack(teamNum, attackerType, team);
            }
            endDungeon('Failed to find a successful fight!', attackerType);
            return undefined;
        }

        /** Find best neutral team */
        async function findBestBattleNeutral(teamNum, attackerType, factors, mode) {
            let countFactors = factors.length < 4 ?
                factors.length : 4;
            let araji = !titansStates['4013']?.isDead;
            let eden = !titansStates['4023']?.isDead;
            let dark = [4032, 4033].filter((e) => !titansStates[e]?.isDead);
            let light = [4042].filter((e) => !titansStates[e]?.isDead);
            let actions = [];
            if (mode) {
                for (let i = 0; i < countFactors; i++) {
                    actions.push(startBattle(teamNum, attackerType, getNeutralTeam(factors[i].id)));
                }
                if (countFactors > 1) {
                    let firstId = factors[0].id;
                    let secondId = factors[1].id;
                    actions.push(startBattle(teamNum, attackerType, getNeutralTeam(firstId, 4001, secondId)));
                    actions.push(startBattle(teamNum, attackerType, getNeutralTeam(firstId, 4002, secondId)));
                    actions.push(startBattle(teamNum, attackerType, getNeutralTeam(firstId, 4003, secondId)));
                }
                if (araji) {
                    actions.push(startBattle(teamNum, attackerType, getNeutralTeam(4013)));
                    if (countFactors > 0) {
                        let firstId = factors[0].id;
                        actions.push(startBattle(teamNum, attackerType, getNeutralTeam(firstId, 4000, 4013)));
                        actions.push(startBattle(teamNum, attackerType, getNeutralTeam(firstId, 4001, 4013)));
                        actions.push(startBattle(teamNum, attackerType, getNeutralTeam(firstId, 4002, 4013)));
                        actions.push(startBattle(teamNum, attackerType, getNeutralTeam(firstId, 4003, 4013)));
                    }
                    if (eden) {
                        actions.push(startBattle(teamNum, attackerType, getNeutralTeam(4023, 4000, 4013)));
                    }
                }
            } else {
                if (mode) {
                    for (let i = 0; i < factors.length; i++) {
                        actions.push(startBattle(teamNum, attackerType, getNeutralTeam(factors[i].id)));
                    }
                } else {
                    countFactors = factors.length < 2 ? factors.length : 2;
                }
                for (let i = 0; i < countFactors; i++) {
                    let mainId = factors[i].id;
                    if (araji && (mode || i > 0)) {
                        actions.push(startBattle(teamNum, attackerType, getNeutralTeam(mainId, 4000, 4013)));
                        actions.push(startBattle(teamNum, attackerType, getNeutralTeam(mainId, 4001, 4013)));
                        actions.push(startBattle(teamNum, attackerType, getNeutralTeam(mainId, 4002, 4013)));
                        actions.push(startBattle(teamNum, attackerType, getNeutralTeam(mainId, 4003, 4013)));
                    }
                    for (let i = 0; i < dark.length; i++) {
                        let darkId = dark[i];
                        actions.push(startBattle(teamNum, attackerType, getNeutralTeam(mainId, 4001, darkId)));
                        actions.push(startBattle(teamNum, attackerType, getNeutralTeam(mainId, 4002, darkId)));
                        actions.push(startBattle(teamNum, attackerType, getNeutralTeam(mainId, 4003, darkId)));
                    }
                    for (let i = 0; i < light.length; i++) {
                        let lightId = light[i];
                        actions.push(startBattle(teamNum, attackerType, getNeutralTeam(mainId, 4001, lightId)));
                        actions.push(startBattle(teamNum, attackerType, getNeutralTeam(mainId, 4002, lightId)));
                        actions.push(startBattle(teamNum, attackerType, getNeutralTeam(mainId, 4003, lightId)));
                    }
                    let isFull = mode || i > 0;
                    for (let j = isFull ? i + 1 : 2; j < factors.length; j++) {
                        let extraId = factors[j].id;
                        actions.push(startBattle(teamNum, attackerType, getNeutralTeam(mainId, 4000, extraId)));
                        actions.push(startBattle(teamNum, attackerType, getNeutralTeam(mainId, 4001, extraId)));
                        actions.push(startBattle(teamNum, attackerType, getNeutralTeam(mainId, 4002, extraId)));
                    }
                }
                if (araji) {
                    if (mode) {
                        actions.push(startBattle(teamNum, attackerType, getNeutralTeam(4013)));
                    }
                    for (let i = 0; i < dark.length; i++) {
                        let darkId = dark[i];
                        actions.push(startBattle(teamNum, attackerType, getNeutralTeam(darkId, 4001, 4013)));
                        actions.push(startBattle(teamNum, attackerType, getNeutralTeam(darkId, 4002, 4013)));
                    }
                    for (let i = 0; i < light.length; i++) {
                        let lightId = light[i];
                        actions.push(startBattle(teamNum, attackerType, getNeutralTeam(lightId, 4001, 4013)));
                        actions.push(startBattle(teamNum, attackerType, getNeutralTeam(lightId, 4002, 4013)));
                    }
                }
                for (let i = 0; i < dark.length; i++) {
                    let firstId = dark[i];
                    actions.push(startBattle(teamNum, attackerType, getNeutralTeam(firstId)));
                    for (let j = i + 1; j < dark.length; j++) {
                        let secondId = dark[j];
                        actions.push(startBattle(teamNum, attackerType, getNeutralTeam(firstId, 4001, secondId)));
                        actions.push(startBattle(teamNum, attackerType, getNeutralTeam(firstId, 4002, secondId)));
                    }
                }
                for (let i = 0; i < light.length; i++) {
                    let firstId = light[i];
                    actions.push(startBattle(teamNum, attackerType, getNeutralTeam(firstId)));
                    for (let j = i + 1; j < light.length; j++) {
                        let secondId = light[j];
                        actions.push(startBattle(teamNum, attackerType, getNeutralTeam(firstId, 4001, secondId)));
                        actions.push(startBattle(teamNum, attackerType, getNeutralTeam(firstId, 4002, secondId)));
                    }
                }
            }
            for (let result of await Promise.all(actions)) {
                let recovery = getRecovery(result);
                if (recovery > bestBattle.recovery) {
                    bestBattle.recovery = recovery;
                    bestBattle.attackers = result.progress[0].attackers.heroes;
                }
            }
        }

        /** Get neutral team */
        function getNeutralTeam(id, swapId, addId) {
            let neutralTeam = clone(teams.water);
            let neutral = neutralTeam.heroes;
            if (neutral.length == 4) {
                if (!!swapId) {
                    for (let i in neutral) {
                        if (neutral[i] == swapId) {
                            neutral[i] = addId;
                        }
                    }
                }
            } else if (!!addId) {
                neutral.push(addId);
            }
            neutral.push(id);
            return neutralTeam;
        }

        /** Get titan team */
        function getTeam(titans) {
            return {
                favor: {},
                heroes: Object.keys(titans).map((id) => parseInt(id)),
                teamNum: 0,
            };
        }

        /** Calculate titan combat readiness factor */
        function calcFactor() {
            let neutral = teams.neutral;
            let factors = [];
            for (let i in neutral) {
                let titanId = neutral[i];
                let titan = titansStates[titanId];
                let factor = !!titan ? titan.hp / titan.maxHp + titan.energy / 10000.0 : 1;
                if (factor > 0) {
                    factors.push({ id: titanId, value: factor });
                }
            }
            factors.sort(function (a, b) {
                return a.value - b.value;
            });
            return factors;
        }

        /** Return best result from multiple battles */
        async function getBestRecovery(teamNum, attackerType, team, countBattle) {
            let bestRecovery = -1000;
            let actions = [];
            for (let i = 0; i < countBattle; i++) {
                actions.push(startBattle(teamNum, attackerType, team));
            }
            for (let result of await Promise.all(actions)) {
                let recovery = getRecovery(result);
                if (recovery > bestRecovery) {
                    bestRecovery = recovery;
                }
            }
            return bestRecovery;
        }

        /** Returns the difference in the attacking team's health after and before the battle and checks the titans' health for the required minimum */
        function getRecovery(result) {
            if (result.result.stars < 3) {
                return -100;
            }
            let beforeSumFactor = 0;
            let afterSumFactor = 0;
            let beforeTitans = result.battleData.attackers;
            let afterTitans = result.progress[0].attackers.heroes;
            for (let i in afterTitans) {
                let titan = afterTitans[i];
                let percentHP = titan.hp / beforeTitans[i].hp;
                let energy = titan.energy;
                let factor = checkTitan(i, energy, percentHP) ? getFactor(i, energy, percentHP) : -100;
                afterSumFactor += factor;
            }
            for (let i in beforeTitans) {
                let titan = beforeTitans[i];
                let state = titan.state;
                beforeSumFactor += !!state ?
                    getFactor(i, state.energy, state.hp / titan.hp) : 1;
            }
            return afterSumFactor - beforeSumFactor;
        }

        /** Return state of the titan */
        function getFactor(id, energy, percentHP) {
            let elemantId = id.slice(2, 3);
            let isEarthOrFire = elemantId == '1' || elemantId == '2';
            let energyBonus = id == '4020' && energy == 1000 ? 0.1 : energy / 20000.0;
            let factor = percentHP + energyBonus;
            return isEarthOrFire ? factor : factor / 10;
        }

        /** Checks state of the titan */
        function checkTitan(id, energy, percentHP) {
            switch (id) {
                // Earth: Tank Angus
                case '4020':
                    return percentHP > 0.25 || (energy == 1000 && percentHP > 0.05);
                    break;
                // Fire: Tank Moloch
                case '4010':
                    return percentHP + energy / 2000.0 > 0.63;
                    break;
                // Water: Tank Sigurd
                case '4000':
                    return percentHP > 0.62 || (energy < 1000 && ((percentHP > 0.45 && energy >= 400) || (percentHP > 0.3 && energy >= 670)));
            }
            return true;
        }

        /** Start battle */
        function startBattle(teamNum, attackerType, args) {
            return new Promise(function (resolve, reject) {
                args.teamNum = teamNum;
                let startBattleCall = {
                    calls: [{
                        name: 'dungeonStartBattle',
                        args,
                        ident: 'body',
                    }, ],
                };
                send(JSON.stringify(startBattleCall), resultBattle, {
                    resolve,
                    teamNum,
                    attackerType,
                });
            });
        }

        /** Returns the battle result to a promise */
        function resultBattle(resultBattles, args) {
            battleData = resultBattles.results[0].result.response;
            battleType = 'get_tower';
            if (battleData.type == 'dungeon_titan') {
                battleType = 'get_titan';
            }
            battleData.progress = [{ attackers: { input: ['auto', 0, 0, 'auto', 0, 0] } }];
            BattleCalc(battleData, battleType, function (result) {
                result.teamNum = args.teamNum;
                result.attackerType = args.attackerType;
                args.resolve(result);
            });
        }

        /** End the battle */
        async function endBattle(battleInfo) {
            if (!!battleInfo) {
                const args = {
                    result: battleInfo.result,
                    progress: battleInfo.progress,
                };
                if (battleInfo.result.stars < 3) {
                    endDungeon('A hero or titan could die in battle!', battleInfo);
                    return;
                }
                if (countPredictionCard > 0) {
                    args.isRaid = true;
                    countPredictionCard--;
                } else {
                    const timer = getTimer(battleInfo.battleTime);
                    console.log("Timer set: " + timer + " sec");
                    await countdownTimer(timer, `${I18N('HWHDE')}: ${I18N('HWHDE_TITANITE')} ${dungeonActivityPB}/${maxDungeonActivityPB} ${talentMsg}`, stopDungeon);
                }
                const calls = [{
                    name: 'dungeonEndBattle',
                    args,
                    ident: 'body',
                }, ];
                lastDungeonBattleData = null;
                send(JSON.stringify({ calls }), resultEndBattle);
            } else {
                endDungeon('dungeonEndBattle win: false\n', battleInfo);
            }
        }

        /** Receive and process the battle results */
        function resultEndBattle(e) {
            if (!!e && !!e.results) {
                let battleResult = e.results[0].result.response;
                if ('error' in battleResult) {
                    endDungeon('errorBattleResult', battleResult);
                    return;
                }
                dungeonGetInfo = battleResult.dungeon ?? battleResult;
                dungeonActivity += battleResult.reward.dungeonActivity ?? 0;
                dungeonActivityPB = `<span style="color: white;">${dungeonActivity}</span>`;
                // Update global states with new battle results before checking the floor
                if (dungeonGetInfo.states && dungeonGetInfo.states.titans) {
                    Object.assign(titansStates, dungeonGetInfo.states.titans);
                }
                checkFloor(dungeonGetInfo);
            } else {
                endDungeon('Lost connection with the game server!', 'break');
            }
        }

        /** Add titan team to general team list */
        function addTeam(team) {
            for (let i in countTeam) {
                if (equalsTeam(countTeam[i].team, team)) {
                    countTeam[i].count++;
                    return;
                }
            }
            countTeam.push({ team: team, count: 1 });
        }

        /** Compare teams for equality */
        function equalsTeam(team1, team2) {
            if (team1.length == team2.length) {
                for (let i in team1) {
                    if (team1[i] != team2[i]) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        }

        function saveProgress() {
            let saveProgressCall = {
                calls: [{
                    name: 'dungeonSaveProgress',
                    args: {},
                    ident: 'body',
                }, ],
            };
            send(JSON.stringify(saveProgressCall), resultEndBattle);
        }

        /** Display titan statistics */
        function showTitanStats() {
            const floorNumber = dungeonGetInfo ? dungeonGetInfo.floorNumber : 'Unknown';
            console.log('Titan statistics at floor number: ', floorNumber);
            // Titan display logic mapped from the provided working code example
            const rows = [
                { element: 'fire', color: '#e74c3c', icon: '🔥', label: 'FIRE' },
                { element: 'water', color: '#3498db', icon: '🌊', label: 'WATER' },
                { element: 'earth', color: '#2ecc71', icon: '🌍', label: 'EARTH' },
                { element: 'light', color: '#f1c40f', icon: '☀️', label: 'LIGHT' },
                { element: 'dark', color: '#9b59b6', icon: '🌑', label: 'DARK' },
            ];

            const titans = titansStates;
            const colWidth = 18;
            let logMsg = '';
            let logStyles = [];

            rows.forEach(row => {
                logMsg += `%c ${row.icon} ${row.label.padEnd(8)} `;
                logStyles.push(`color: ${row.color}; font-weight: bold; border-bottom: 1px solid ${row.color};`);

                // Filter and format titans
                Object.keys(titanGetAll).forEach(id => {
                    const titanData = lib.data.titan[id];
                    if (titanData && titanData.element === row.element) {
                        const name = cheats.translate(`LIB_HERO_NAME_${id}`).split(' ')[0];
                        const hpPerc = titans[id]?.hp ? Math.floor((titans[id]?.hp / titans[id]?.maxHp) * 100) : 100;
                        const energy = titans[id]?.energy || 0;
                        let titanStr = '';

                        // Check if dead, otherwise show name + stats
                        if (titans[id]?.isDead) {
                            titanStr = `${name}💀`;
                        } else {
                            titanStr = `${name}❤️${hpPerc}⚡${energy}`;
                        }

                        // Add padding to the string to force column alignment
                        logMsg += `%c${titanStr.padEnd(colWidth)}`;
                        logStyles.push(`color: ${row.color};`);
                    }
                });
                logMsg += '\n';
            });

            console.log(logMsg, ...logStyles);
        }

        /** Display final statistics of dungeon completion */
        function showFinalStats() {
            let activity = dungeonActivity - startDungeonActivity;
            let workTime = clone(timeDungeon);
            workTime.all = new Date().getTime() - workTime.all;
            for (let i in workTime) {
                workTime[i] = Math.round(workTime[i] / 1000);
            }
            countTeam.sort(function (a, b) {
                return b.count - a.count;
            });

            showTitanStats();

            console.log('Titanite collected: ', activity);
            console.log('Collection speed: ' + Math.round((3600 * activity) / workTime.all) + ' Titanite/hour');
            console.log('Time for excavations: ');
            for (let i in workTime) {
                let timeNow = workTime[i];
                console.log(i + ': ', Math.round(timeNow / 3600) + ' h. ' + Math.round((timeNow % 3600) / 60) + ' min. ' + (timeNow % 60) + ' sec.');
            }

            console.log('Frequency of team usage: ');
            for (let i in countTeam) {
                let teams = countTeam[i];
                console.log(teams.team + ': ', teams.count);
            }
        }

        /** Finish farming the dungeon */
        function endDungeon(reason, info) {
            if (!end) {
                end = true;
                console.log(reason, info);
                showFinalStats();
                if (info == 'break') {
                    setProgress(`${I18N('HWHDE_STOPPED')}: ${I18N('HWHDE_TITANITE')} ${dungeonActivityPB}/${maxDungeonActivityPB} ${I18N('HWHDE_SRV_CON_LOST')}`, false, hideProgress);
                } else {
                    if (stopDung == true) {
                        setProgress(`${I18N('HWHDE_STOPPED_MANUALLY')}: ${I18N('HWHDE_TITANITE')} ${dungeonActivityPB}/${maxDungeonActivityPB}`, false, hideProgress);
                    } else {
                        setProgress(`${I18N('HWHDE_COMPLETED')}: ${I18N('HWHDE_TITANITE')} ${dungeonActivityPB}/${maxDungeonActivityPB}`, false, hideProgress);
                    }
                }
                setTimeout(cheats.refreshGame, 1000);
                resolve();
            }
        }
    }

    this.HWHClasses.executeDungeon = executeDungeon;

})();