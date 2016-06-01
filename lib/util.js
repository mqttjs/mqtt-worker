/**
 * Created by Sandro Kock <sandro.kock@gmail.com> on 12.03.16.
 */


var exports = module.exports = {};

exports.objectToArray = function (obj) {
    var arr = [];
    if(obj && typeof obj === 'object') {
        Object.keys(obj).forEach(function (key) {
            arr.push(obj[key]);
        });
    }
    return arr;
};
