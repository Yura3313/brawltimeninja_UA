// rebuild for frontend with ./node_modules/.bin/tsc lib/util.ts -m ESNext
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
export var camelToSnakeCase = function (str) { return str.replace(/[A-Z]/g, function (letter) { return "_" + letter.toLowerCase(); }); };
export var camelToKebab = function (s) {
    return s.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
};
export var capitalize = function (str) { return str.replace(/(?:^|\s)\S/g, function (a) { return a.toUpperCase(); }); };
export var capitalizeWords = function (str) { return str.split(' ').map(function (w) { return capitalize(w); }).join(' '); };
export function scaleMinMax(values) {
    var min = Math.min.apply(Math, values);
    var max = Math.max.apply(Math, values);
    if (min === max) {
        return values.map(function (value) { return 0.5; });
    }
    return values.map(function (value) { return (value - min) / (max - min); });
}
export function zip(arr1, arr2) {
    return arr1.map(function (value, index) { return [value, arr2[index]]; });
}
export function hoursSinceDate(date) {
    var then = Date.parse(date);
    var now = (new Date()).getTime();
    return Math.floor((now - then) / 1000 / 3600);
}
export var brawlerId = function (entry) {
    return entry.name.replace(/\.| /g, '_').toLowerCase();
};
export var modeToBackgroundId = function (modeCamelCase) {
    var mode = camelToSnakeCase(modeCamelCase);
    if (mode == 'big_game') {
        return 'bossfight';
    }
    if (mode.endsWith('showdown')) {
        return 'showdown';
    }
    return mode.replace('_', '');
};
export function formatMode(mode) {
    return camelToSnakeCase(mode)
        .split('_')
        .map(function (w) { return capitalize(w); })
        .join(' ');
}
export function xpToHours(xp) {
    return xp / 220; // 145h for 30300 XP as measured by @schneefux
}
export function induceAdsIntoArray(array, adSlots, adFrequency) {
    return array.reduce(function (agg, element, index, self) {
        var lastSlotIndex = Math.floor(index / adFrequency) + 1;
        if (index === self.length - 1 && lastSlotIndex < adSlots.length) {
            var ad = {
                adSlot: adSlots[lastSlotIndex],
                id: 'ad-last'
            };
            return agg.concat(element, ad);
        }
        var slotIndex = Math.floor(index / adFrequency);
        if (index % adFrequency === adFrequency - 1 && slotIndex < adSlots.length) {
            var ad = {
                adSlot: adSlots[slotIndex],
                id: "ad-" + index
            };
            return agg.concat(ad, element);
        }
        return agg.concat(element);
    }, []);
}
export var metaStatMaps = {
    labels: {
        trophies: 'Trophies',
        spTrophies: 'with Star Power',
        trophyChange: 'this season',
        winRate: '3v3 Win Rate',
        rank1Rate: 'SD Win Rate',
        level: 'Avg. Level',
        starRate: 'Star Player',
        pickRate: 'Pick Rate',
        pickRate_boss: 'Boss Pick Rate',
        duration: 'Duration',
        duration_boss: 'Boss Duration',
        rank: 'Avg. Rank',
        rank1: 'Wins recorded',
        wins: 'Wins recorded'
    },
    labelsShort: {
        trophies: 'Trophies',
        spTrophies: 'with Star Power',
        trophyChange: 'this season',
        winRate: 'Won',
        rank1Rate: 'SD Won',
        level: 'Level',
        starRate: 'Stars',
        pickRate: 'Picked',
        duration: 'Duration',
        rank: 'Rank',
        rank1: 'Rank 1',
        wins: 'Wins'
    },
    icons: {
        trophies: 'trophy',
        spTrophies: 'starpower',
        trophyChange: 'trophy',
        winRate: '📈',
        rank1Rate: '📈',
        level: '🏅',
        starRate: '⭐',
        pickRate: '👇',
        pickRate_boss: '👇',
        duration: '⏰',
        duration_boss: '⏰',
        rank: 'leaderboards',
        rank1: '🏅',
        wins: '🏅'
    },
    formatters: {
        trophies: function (n) { return Math.round(n); },
        spTrophies: function (n) { return Math.round(n); },
        trophyChange: function (n) { return n <= 0 ? Math.round(n) : "+" + Math.round(n); },
        winRate: function (n) { return Math.round(100 * n) + "%"; },
        rank1Rate: function (n) { return Math.round(100 * n) + "%"; },
        starRate: function (n) { return Math.round(100 * n) + "%"; },
        pickRate: function (n) { return Math.round(100 * n) + "%"; },
        pickRate_boss: function (n) { return Math.round(100 * n) + "%"; },
        duration: function (n) { return Math.floor(n / 60) + ":" + Math.floor(n % 60).toString().padStart(2, '0'); },
        duration_boss: function (n) { return Math.floor(n / 60) + ":" + Math.floor(n % 60).toString().padStart(2, '0'); },
        rank: function (n) { return n === null ? 'N/A' : n.toFixed(2); },
        level: function (n) { return n.toFixed(2); },
        rank1: function (n) { return n; },
        wins: function (n) { return n; }
    },
    propPriority: ['wins', 'rank1', 'duration', 'pickRate']
};
/**
 * Get brawlers by event: {
 *  [eventId]: [
 *    brawler id,
 *    brawler name,
 *    brawler stats,
 *    sort prop
 *  ] }
 * sorted by the preferred prop according to propPriority
 */
export function getBestByEvent(mapMeta) {
    return __spreadArrays(Object.entries(mapMeta)).reduce(function (top5, _a) {
        var _b;
        var eventId = _a[0], entry = _a[1];
        return (__assign(__assign({}, top5), (_b = {}, _b[eventId] = __spreadArrays(Object.entries(entry.brawlers)).map(function (_a) {
            var brawlerId = _a[0], brawler = _a[1];
            return ({
                id: brawlerId,
                name: brawler.name,
                stats: brawler.stats,
                sortProp: metaStatMaps.propPriority.find(function (prop) { return prop in brawler.stats; })
            });
        })
            .sort(function (brawler1, brawler2) { return brawler2.stats[brawler2.sortProp] - brawler1.stats[brawler1.sortProp]; }), _b)));
    }, {});
}