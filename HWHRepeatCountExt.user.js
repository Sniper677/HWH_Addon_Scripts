// ==UserScript==
// @name            HWHRepeatCountExt
// @name:en         HWHRepeatCountExt
// @name:ru         HWHRepeatCountExt
// @namespace       HWHRepeatCountExt
// @version         0.1.0.0
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
    const { addExtentionName } = HWHFuncs;

    addExtentionName(GM_info.script.name, GM_info.script.version, GM_info.script.author);

    const {
        getInput,
        setProgress,
        hideProgress,
        I18N,
        popup,
    } = HWHFuncs;

    let { i18nLangData } = HWHData;

    const i18nLangDataEn = {
        HWHRCE: `${GM_info.script.name}`,
        HWHRCE_STOPPED: `${GM_info.script.name} stopped`,
        HWHRCE_COMPLETED: `${GM_info.script.name} completed`,
        HWHRCE_MSG_REPEAT_COUNT: 'Enter the number of Repetitions',
        HWHRCE_REPETITIONS: 'Repetitions',
        HWHRCE_BTN_CANCEL: 'Cancel',
        HWHRCE_BTN_REPEAT: 'Repeat',
        HWHRCE_BTN_OK: 'OK',
    };
    const i18nLangDataRu = {
        HWHRCE: `${GM_info.script.name}`,
        HWHRCE_STOPPED: `${GM_info.script.name} остановился`,
        HWHRCE_COMPLETED: `${GM_info.script.name} завершенный`,
        HWHRCE_MSG_REPEAT_COUNT: 'Введите количество повторений',
        HWHRCE_REPETITIONS: 'Повторения',
        HWHRCE_BTN_CANCEL: 'Отмена',
        HWHRCE_BTN_REPEAT: 'Повторить',
        HWHRCE_BTN_OK: 'ХОРОШО',
    };
    i18nLangData['en'] = Object.assign(i18nLangData['en'], i18nLangDataEn);
    i18nLangData['ru'] = Object.assign(i18nLangData['ru'], i18nLangDataRu);

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
                await popup.confirm(
                    `${I18N('HWHRCE_COMPLETED')}<br><br>${I18N('HWHRCE_REPETITIONS')}: ${finalCount}`,
                    [
                        { msg: I18N('HWHRCE_BTN_OK'), result: true, color: 'green' }
                    ]
                );

                return;
            }

            originalSendsMission(missionInfo);

        } else {
            // --- NO LOOP ACTIVE (1st run) ---
            const repeatCount = await popup.confirm(
                I18N('HWHRCE_MSG_REPEAT_COUNT'),
                [
                    { msg: I18N('HWHRCE_BTN_REPEAT'), isInput: true, default: Number(localStorage.getItem('HWHRepeatCountExt')) || 10, color: 'green' },
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