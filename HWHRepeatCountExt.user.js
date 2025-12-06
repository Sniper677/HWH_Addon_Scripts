// ==UserScript==
// @name            HWHRepeatCountExt
// @name:en         HWHRepeatCountExt
// @name:ru         HWHRepeatCountExt
// @namespace       HWHRepeatCountExt
// @version         0.0.4.2.1
// @description     Extension for HeroWarsHelper script
// @description:en  Extension for HeroWarsHelper script
// @description:ru  Расширение для скрипта HeroWarsHelper
// @author          Sniper677
// @license         Copyright Sniper677
// @homepage        https://github.com/Sniper677/HWH_Addon_Scripts
// @icon            https://cdn0.iconfinder.com/data/icons/superheros-1/512/Superheroes-04-512.png
// @match           https://www.hero-wars.com/*
// @match           https://apps-1701433570146040.apps.fbsbx.com/*
// @run-at          document-start
// @downloadURL     https://github.com/Sniper677/HWH_Addon_Scripts/raw/refs/heads/main/HWHRepeatCountExt.user.js
// @updateURL       https://github.com/Sniper677/HWH_Addon_Scripts/raw/refs/heads/main/meta/HWHRepeatCountExt.meta.js
// ==/UserScript==

(function () {

    if (!this.HWHClasses) {
        console.log('%cObject for extension not found', 'color: red');
        return;
    }

    console.log('%cStart Extension ' + GM_info.script.name + ', v' + GM_info.script.version + ' by ' + GM_info.script.author, 'color: green');

    const { ScriptMenu } = this.HWHClasses;
    const { addExtentionName, I18N, setProgress, popup } = HWHFuncs;

    addExtentionName(GM_info.script.name, GM_info.script.version, GM_info.script.author);

    let missionLoopData = null;
    const originalSendsMission = this.sendsMission;

    this.sendsMission = async function (missionInfo) {

        if (missionInfo.count === undefined) {
            missionInfo.count = 0;
        }

        if (missionLoopData) {
            // --- LOOP IS ACTIVE ---
            if (missionInfo.count >= missionLoopData.maxCount) {
                missionLoopData = null;

                const scriptMenu = ScriptMenu.getInst();
                if (scriptMenu._currentStatusClickHandler) {
                    scriptMenu._currentStatusClickHandler();
                    console.log(GM_info.script.name + ": 'isStopSendMission' flag set successfully.");
                }

                originalSendsMission(missionInfo);

                const finalCount = missionInfo.count;
                setProgress('');
                await popup.confirm(`${I18N('STOPPED')}<br>${I18N('REPETITIONS')}: ${finalCount}`, [{
                    msg: 'Ok',
                    result: true,
                    color: 'green'
                }]);

                return;
            }

            originalSendsMission(missionInfo);

        } else {
            // --- NO LOOP ACTIVE (1st run) ---
            const repeatCount = await popup.confirm(
                I18N('MSG_REPEAT_MISSION'),
                [
                    { msg: I18N('BTN_REPEAT'), isInput: true, default: Number(localStorage.getItem('HWHRepeatCountExt')) || 10, color: 'green' },
                ]
            );

            let maxCount = Number(repeatCount);

            // Check if input is invalid (false, null, NaN, or <= 0)
            const isInvalidInput = (repeatCount === false || repeatCount === null || !maxCount || maxCount <= 0);

            if (isInvalidInput) {
                // If input is invalid or cancelled, set maxCount to 1 for a single execution
                maxCount = 1;
                console.log(GM_info.script.name + ": Invalid input detected. Defaulting to one-time execution (maxCount = 1).");
            } else {
                // Input is valid, save it for next time
                localStorage.setItem('HWHRepeatCountExt', repeatCount);
            }

            // Set up loop data with the determined maxCount (1 for invalid, user's value otherwise)
            missionLoopData = {
                maxCount: maxCount
            };

            // Run the mission once to start the process
            originalSendsMission(missionInfo);
        }
    };

})();