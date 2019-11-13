const Discord = require('discord.js');
const fs = require('fs');
const bot = new Discord.Client();
const prefix = "lds ";
const bom = require("./book-of-mormon.json");
const dc = require("./doctrine-and-covenants.json");
const pgp = require("./pearl-of-great-price.json");

bot.on("ready", () => {
    console.log("ready");
});

function clean(text) {
    if (typeof(text) === "string") {
        return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
    } else {
        return text;
    }
}

bot.on("message", message => {

    if (message.author.id == 221285118608801802) {
        var userColorPreference = 0xf2a93b;
    } else {
        var userColorPreference = 0x086587;
    }

    function get_line(filename, line_no1, line_no2, callback) {
        var data = fs.readFileSync(filename, 'utf8');
        var lines = data.split("\n");
        if (line_no2 > lines.length) {
            throw new Error('File end reached without finding line');
        }

        let pttrn = /^\s*/;
        let indentation_removal = [];
        let total_lines = [];
        let indentation_length;
        let indentation_amount = []
        let final_lines = [];
        for (var i = line_no1; i <= line_no2; i++) {
            let line_holder = "";
            line_holder += lines[i];
            indentation_length = (line_holder.match(pttrn)[0].length);
            total_lines.push(line_holder);
            indentation_amount.push(indentation_length);
        }
        let min = Math.min(...indentation_amount);
        for (var i = 0; i < total_lines.length; i++) {
            let holder = "";
            holder += total_lines[i];
            indentation_length = (holder.match(pttrn)[0].length);
            if (indentation_length < min) {
                holder = holder.substring(holder.length)
                final_lines.push(holder)
            } else {
                holder = holder.substring(min);
                final_lines.push(holder);
            }
        }
        callback(null, final_lines);
    }

    let page = 0;

    function embed_page(inital_embed, edited_embeds) {
        message.channel.send(inital_embed).then(sentEmbed => {
            sentEmbed.react("⬅").then(r => {
                sentEmbed.react('➡');
            });
            const backwardsFilter = (reaction, user) => reaction.emoji.name === '⬅' && user.id === message.author.id;
            const forwardsFilter = (reaction, user) => reaction.emoji.name === '➡' && user.id === message.author.id;

            const backwards = sentEmbed.createReactionCollector(backwardsFilter, {
                timer: 600000
            });
            const forwards = sentEmbed.createReactionCollector(forwardsFilter, {
                timer: 600000
            });
            backwards.on('collect', r => {
                if (page > 0 && page < edited_embeds.length) {
                    page--;
                    sentEmbed.edit({
                        embed: edited_embeds[page]
                    });
                }
                r.remove(r.users.filter(u => u === message.author).first());
            })
            forwards.on('collect', r => {
                if (page >= 0 && page < edited_embeds.length) {
                    page++;
                    sentEmbed.edit({
                        embed: edited_embeds[page]
                    });
                }
                r.remove(r.users.filter(u => u === message.author).first());
            })

        });
    }

    let bom_books = {
        "Nephi": 0,
        "Jacob": 1,
        "Enos": 2,
        "Jarom": 3,
        "Omni": 4,
        "Words_of_Mormon": 5,
        "Wom": 5,
        "Mosiah": 6,
        "Alma": 7,
        "Helaman": 8,
        "Mormon": 9,
        "Ether": 10,
        "Moroni": 11,
    }

    let pgp_books = {
        "Moses": 0,
        "Abraham": 1,
        "Joseph_Smith_Matthew": 2,
        "JSM": 2,
        "Joseph_Smith_History": 3,
        "JSH": 3,
        "Articles_of_Faith": 4,
        "AOF": 4,
    }

    if (message.author.bot) return;
    var contents = message.content.slice(prefix.length) + " ~";
    const command = contents.substring(0, contents.indexOf(" ")).trim();
    var additions = contents.slice(contents.indexOf(" ")).split("~");
    const argument = additions.shift();
    additions.map(function(value, key, mapObj) {
        mapObj[key] = value.trim();
    });
    const args = message.content.split(' ');
    const randomVarName = args.shift();

    var message_array = message.content.split(" ");

    var citations = [];

    var name_result = "";
    var words = "words";
    var Of = "of";
    for (let name in bom_books) {
        for (var i = 0; i < message_array.length - 1; i++) {
            var name_construction = name.split("_"); // Split book name by "_" 
            if (message_array[i].toLowerCase() == name_construction[0].toLowerCase()) {
                if (typeof message_array[i - 2] != "undefined" && typeof message_array[i - 1] != "undefined") {
                    if (name_construction.toString() == "Mormon") { // This is to prevent bot from sending scriptures from both "Mormon 1:1" and "Words of Mormon 1:1"
                        if (message_array[i - 2].toLowerCase() == words.toLowerCase() && message_array[i - 1].toLowerCase() == Of.toLowerCase()) {
                            continue;
                        }
                    }
                }
                if (typeof name_construction[1] != 'undefined' && typeof name_construction[2] != 'undefined') { // If book name has multiple words.  
                    if (name_construction[1].toLowerCase() == message_array[i + 1].toLowerCase()) { // Checks if following words in message after name_construction[0] (e.g "Words") match name_construction[1] (e.g "of")
                        name_result = `${name_construction[0]}` + '_' + `${name_construction[1]}`; // begins constructing book name.
                        if (typeof message_array[i + 2] != "undefined") {
                            if (name_construction[2].toLowerCase() == message_array[i + 2].toLowerCase()) {
                                name_result += '_' + `${name_construction[2]}`; // Book construction complete!
                            } else {
                                continue;
                            }
                        } else {
                            continue;
                        }
                    } else {
                        continue;
                    }
                } else {
                    name_result = name_construction.toString(); // If book name doesn't have multiple words, but bot (obviously) still found book name in message, than convert name_construction to string and set it as name_result
                }
                if (name_construction.length == 1) {
                    var location = message_array[i + 1]; // Should be something like 1:8 or 1:8-10
                } else {
                    var location = message_array[i + 3]; // Should be something like 1:8 or 1:8-10
                }
                var chapter = parseInt(location.split(":")[0]); // 1
                if (isNaN(chapter)) return; // No chapter number; exit the function here

                var verse_nums = location.split(":")[1]; // 8 or 8-10
                try {
                    if (verse_nums.indexOf("-") != -1) { // Contains -; is a range eg. 8-10
                        var verse_first = parseInt(verse_nums.split("-")[0]); // 8
                        if (isNaN(verse_first)) return; // No verse number; exit the function here

                        var verse_last = parseInt(verse_nums.split("-")[1]); // 10
                        if (isNaN(verse_last)) return; // No last verse number; exit the function here or just ignore and set to verse_first
                    } else { // Just a single verse; eg 8
                        var verse_first = parseInt(verse_nums); // 8
                        if (isNaN(verse_first)) return; // No verse number; exit the function here
                        var verse_last = verse_first; // 8
                    }
                } catch (error) {
                    console.log(error);
                }
                if (verse_first > verse_last) {
                    verse_last = verse_first + (verse_first = verse_last) - verse_last;
                }
                if ("numbers" in bom.books[bom_books[name]]) {
                    // This book has multiples of the same name, so look for a number
                    if (i > 0) { // Book name isn't the first word in the message (which would mean no number given)
                        var booknum = parseInt(message_array[i - 1]);
                        if (isNaN(booknum)) return; // No book number; exit the function here
                        citations.push([name_construction, chapter, verse_first, verse_last, booknum])
                        // We can later check if the size of this array is 4 or 5. if 5, we know it's a book like nephi
                    }
                } else {
                    citations.push([name_result, chapter, verse_first, verse_last])
                }
            }
        }
    }

    for (var citation of citations) {
        var books = bom.books[bom_books[citation[0]]];
        if (citation.length == 4) {
            // Normal Book
            var chapter = books.chapters[citation[1] - 1];
        } else {
            // Length is 5; a book like Nephi
            try {
                if (citation[4] <= 4 && citation[4] > 0) {
                    var chapter = books.numbers[citation[4] - 1].chapters[citation[1] - 1];
                } else {
                    return;
                }
            } catch (error) {
                console.log(error);
            }
        }
        if (citation[2] == citation[3]) { // one verse
            if (chapter != undefined) {
                var verse = chapter.verses[citation[2] - 1];
            } else {
                return;
            }
            if (verse != undefined) {
                if (verse.text != undefined) {
                    if (citation.length == 5) {
                        message.channel.send({
                            embed: {
                                color: userColorPreference,
                                title: citation[4] + " " + citation[0] + " " + citation[1] + ":" + citation[2],
                                description: "**" + citation[2] + "** " + verse.text,
                                footer: {
                                    text: "LDS-Bot",
                                    icon_url: bot.user.avatarURL
                                }
                            }
                        });
                    } else {
                        message.channel.send({
                            embed: {
                                color: userColorPreference,
                                title: citation[0].replace(/_/g, " ") + " " + citation[1] + ":" + citation[2],
                                description: "**" + citation[2] + "** " + verse.text,
                                footer: {
                                    text: "LDS-Bot",
                                    icon_url: bot.user.avatarURL
                                }
                            }
                        });
                    }
                } else {
                    return;
                }
            } else {
                return;
            }
        } else { // multiple verses
            let page_array_bom = [];
            if (chapter != undefined) {
                var next_message = "";
                for (var v = citation[2] - 1; v < citation[3]; v++) {
                    try {
                        var new_message = next_message + "**" + (v + 1) + "** " + chapter.verses[v].text + "\n\n "
                        if (new_message.length <= 2000) {
                            next_message = new_message;
                        } else {
                            if (citation.length == 5) {
                                page_array_bom.push({
                                    color: userColorPreference,
                                    title: citation[4] + " " + citation[0].replace(/_/g, " ") + " " + citation[1] + ":" + verse_first + "-" + verse_last,
                                    description: next_message
                                });

                            } else {
                                page_array_bom.push({
                                    color: userColorPreference,
                                    title: citation[0].replace(/_/g, " ") + " " + citation[1] + ":" + verse_first + "-" + verse_last,
                                    description: next_message
                                });
                            }
                            next_message = "**" + (v + 1) + "** " + chapter.verses[v].text + "\n\n ";
                        }
                    } catch (error) {
                        console.log(error);
                        return;
                    }
                }
                if (next_message.length != 0 && next_message != undefined) {
                    if (citation.length == 5) {
                        page_array_bom.push({
                            color: userColorPreference,
                            title: citation[4] + " " + citation[0].replace(/_/g, " ") + " " + citation[1] + ":" + verse_first + "-" + verse_last,
                            description: next_message
                        });
                    } else {
                        page_array_bom.push({
                            color: userColorPreference,
                            title: citation[0].replace(/_/g, " ") + " " + citation[1] + ":" + verse_first + "-" + verse_last,
                            description: next_message
                        });
                    }
                }
                embed_page({
                    embed: page_array_bom[0]
                }, page_array_bom)
            } else {
                return;
            }

        }
    }

    // Yes some likely unnecessary duplicate code haha, I'll get to it eventually ¯\_(ツ)_/¯

    var name_dc = "D&C";
    var message_array_dc = message.content.split(" ");

    var citations_dc = [];
    for (var i = 0; i < message_array_dc.length - 1; i++) {
        if (message_array_dc[i].toLowerCase() == name_dc.toLowerCase()) {
            var location_dc = message_array_dc[i + 1]; // Should be something like 1:8 or 1:8-10
            var chapter_dc = parseInt(location_dc.split(":")[0]); // 1
            if (isNaN(chapter_dc)) return; // No chapter number; exit the function here

            var verse_nums_dc = location_dc.split(":")[1]; // 8 or 8-10
            try {
                if (verse_nums_dc.indexOf("-") != -1) { // Contains -; is a range eg. 8-10
                    var verse_first_dc = parseInt(verse_nums_dc.split("-")[0]); // 8
                    if (isNaN(verse_first_dc)) return; // No verse number; exit the function here

                    var verse_last_dc = parseInt(verse_nums_dc.split("-")[1]); // 10
                    if (isNaN(verse_last_dc)) return; // No last verse number; exit the function here or just ignore and set to verse_first
                } else { // Just a single verse; eg 8
                    var verse_first_dc = parseInt(verse_nums_dc); // 8
                    if (isNaN(verse_first_dc)) return; // No verse number; exit the function here
                    var verse_last_dc = verse_first_dc; // 8
                }
            } catch (error) {
                console.log(error);
            }
            if (verse_first_dc > verse_last_dc) {
                verse_last_dc = verse_first_dc + (verse_first_dc = verse_last_dc) - verse_last_dc;
            }
            citations_dc.push([name_dc, chapter_dc, verse_first_dc, verse_last_dc])
        }
    }

    for (var citation_dc of citations_dc) {
        var chapter_dc = dc.sections[citation_dc[1] - 1];
        if (citation_dc[2] == citation_dc[3]) { // one verse
            if (chapter_dc != undefined) {
                var verse_dc = chapter_dc.verses[citation_dc[2] - 1];
            } else {
                return;
            }
            if (verse_dc != undefined) {
                if (verse_dc.text != undefined) {
                    message.channel.send({
                        embed: {
                            color: userColorPreference,
                            title: citation_dc[0] + " " + citation_dc[1] + ":" + citation_dc[2],
                            description: "**" + citation_dc[2] + "** " + verse_dc.text,
                            footer: {
                                text: "LDS-Bot",
                                icon_url: bot.user.avatarURL
                            }
                        }
                    });
                } else {
                    return;
                }
            } else {
                return;
            }
        } else { // multiple verses
            let page_array_dc = [];
            var next_message_dc = "";
            if (chapter_dc != undefined) {
                var next_message_dc = "";
                for (var v = citation_dc[2] - 1; v < citation_dc[3]; v++) {
                    try {
                        var new_message_dc = next_message_dc + "**" + (v + 1) + "** " + chapter_dc.verses[v].text + "\n\n "
                        if (new_message_dc.length <= 2000) {
                            next_message_dc = new_message_dc;
                        } else {
                            if (citation_dc.length == 5) {
                                page_array_dc.push({
                                    color: userColorPreference,
                                    title: citation_dc[4] + " " + citation_dc[0] + " " + citation_dc[1] + ":" + verse_first_dc + "-" + verse_last_dc,
                                    description: next_message_dc
                                });
                            } else {
                                page_array_dc.push({
                                    color: userColorPreference,
                                    title: citation_dc[0] + " " + citation_dc[1] + ":" + verse_first_dc + "-" + verse_last_dc,
                                    description: next_message_dc
                                });
                            }
                            next_message_dc = "**" + (v + 1) + "** " + chapter_dc.verses[v].text + "\n\n ";
                        }
                    } catch (error) {
                        console.log(error);
                        return;
                    }
                }
                if (next_message_dc.length != 0 && next_message_dc != undefined) {
                    if (citation_dc.length == 5) {
                        page_array_dc.push({
                            color: userColorPreference,
                            title: citation_dc[4] + " " + citation_dc[0] + " " + citation_dc[1] + ":" + verse_first_dc + "-" + verse_last_dc,
                            description: next_message_dc
                        });
                    } else {
                        page_array_dc.push({
                            color: userColorPreference,
                            title: citation_dc[0] + " " + citation_dc[1] + ":" + verse_first_dc + "-" + verse_last_dc,
                            description: next_message_dc
                        });
                    }
                }
                embed_page({
                    embed: page_array_dc[0]
                }, page_array_dc);
            } else {
                return;
            }

        }
    }


    var message_array_pgp = message.content.split(" ");

    var citations_pgp = [];
    var name_result_pgp = "";
    for (let name in pgp_books) {
        for (var i = 0; i < message_array_pgp.length - 1; i++) {
            var name_construction_pgp = name.split("_");
            if (message_array_pgp[i].toLowerCase() == name_construction_pgp[0].toLowerCase()) {
                if (typeof name_construction_pgp[2] != 'undefined') {
                    if (typeof message_array_pgp[i + 2] != 'undefined') {
                        if (name_construction_pgp[2].toLowerCase() != message_array_pgp[i + 2].toLowerCase()) {
                            continue;
                        }
                    }
                }
                if (typeof name_construction_pgp[1] != 'undefined' && typeof name_construction_pgp[2] != 'undefined') {
                    if (name_construction_pgp[1] == message_array_pgp[i + 1].toLowerCase()) {
                        name_result_pgp = `${name_construction_pgp[0]}` + '_' + `${name_construction_pgp[1]}`;
                        if (typeof message_array_pgp[i + 2] != 'undefined') {
                            if (name_construction_pgp[2].toLowerCase() == message_array_pgp[i + 2].toLowerCase()) {
                                name_result_pgp += `${name_construction_pgp[2]}`;
                            }
                        }
                    }
                } else {
                    name_result_pgp = name_construction_pgp.toString();
                }
                if (name_construction_pgp.length == 1) {
                    var location_pgp = message_array_pgp[i + 1]; // Should be something like 1:8 or 1:8-10
                } else {
                    var location_pgp = message_array_pgp[i + 3]; // Should be something like 1:8 or 1:8-10
                }
                try {
                    var chapter_pgp = parseInt(location_pgp.split(":")[0]); // 1

                    if (isNaN(chapter_pgp)) return; // No chapter number; exit the function here

                    var verse_nums_pgp = location_pgp.split(":")[1]; // 8 or 8-10
                } catch (error) {
                    console.log(error);
                }
                try {
                    if (verse_nums_pgp.indexOf("-") != -1) { // Contains -; is a range eg. 8-10
                        var verse_first_pgp = parseInt(verse_nums_pgp.split("-")[0]); // 8
                        if (isNaN(verse_first_pgp)) return; // No verse number; exit the function here

                        var verse_last_pgp = parseInt(verse_nums_pgp.split("-")[1]); // 10
                        if (isNaN(verse_last_pgp)) return; // No last verse number; exit the function here or just ignore and set to verse_first
                    } else { // Just a single verse; eg 8
                        var verse_first_pgp = parseInt(verse_nums_pgp); // 8
                        if (isNaN(verse_first_pgp)) return; // No verse number; exit the function here
                        var verse_last_pgp = verse_first_pgp; // 8
                    }
                } catch (error) {
                    console.log(error);
                }
                if (verse_first_pgp > verse_last_pgp) {
                    verse_last_pgp = verse_first_pgp + (verse_first_pgp = verse_last_pgp) - verse_last_pgp;
                }

                citations_pgp.push([name, chapter_pgp, verse_first_pgp, verse_last_pgp])

            }
        }
    }

    for (var citation_pgp of citations_pgp) {
        var books_pgp = pgp.books[pgp_books[citation_pgp[0]]];
        var chapter_pgp = books_pgp.chapters[citation_pgp[1] - 1];
        if (citation_pgp[2] == citation_pgp[3]) { // one verse
            if (chapter_pgp != undefined) {
                var verse_pgp = chapter_pgp.verses[citation_pgp[2] - 1];
            } else {
                return;
            }
            if (verse_pgp != undefined) {
                if (verse_pgp.text != undefined) {
                    message.channel.send({
                        embed: {
                            color: userColorPreference,
                            title: citation_pgp[0].replace(/_/g, " ") + " " + citation_pgp[1] + ":" + citation_pgp[2],
                            description: "**" + citation_pgp[2] + "** " + verse_pgp.text,
                            footer: {
                                text: "LDS-Bot",
                                icon_url: bot.user.avatarURL
                            }
                        }
                    });
                } else {
                    return;
                }
            } else {
                return;
            }
        } else { // multiple verses
            let page_array_pgp = [];
            if (chapter_pgp != undefined) {
                var next_message_pgp = "";
                for (var v = citation_pgp[2] - 1; v < citation_pgp[3]; v++) {
                    try {
                        var new_message = next_message_pgp + "**" + (v + 1) + "** " + chapter_pgp.verses[v].text + "\n\n "
                        if (new_message.length <= 2000) {
                            next_message_pgp = new_message;
                        } else {
                            if (citation_pgp.length == 5) {
                                page_array_pgp.push({
                                    color: userColorPreference,
                                    title: citation_pgp[4] + " " + citation_pgp[0].replace(/_/g, " ") + " " + citation_pgp[1] + ":" + verse_first_pgp + "-" + verse_last,
                                    description: next_message_pgp
                                });
                            } else {
                                page_array_pgp.push({
                                    color: userColorPreference,
                                    title: citation_pgp[0].replace(/_/g, " ") + " " + citation_pgp[1] + ":" + verse_first_pgp + "-" + verse_last,
                                    description: next_message_pgp
                                });
                            }
                            next_message_pgp = "**" + (v + 1) + "** " + chapter_pgp.verses[v].text + "\n\n ";
                        }
                    } catch (error) {
                        console.log(error);
                        return;
                    }
                }
                if (next_message_pgp.length != 0 && next_message_pgp != undefined) {
                    if (citation_pgp.length == 5) {
                        page_array_pgp.push({
                            color: userColorPreference,
                            title: citation_pgp[4] + " " + citation_pgp[0].replace(/_/g, " ") + " " + citation_pgp[1] + ":" + verse_first_pgp + "-" + verse_last,
                            description: next_message_pgp
                        });
                    } else {
                        page_array_pgp.push({
                            color: userColorPreference,
                            title: citation_pgp[0].replace(/_/g, " ") + " " + citation_pgp[1] + ":" + verse_first_pgp + "-" + verse_last,
                            description: next_message_pgp
                        });
                    }
                }
                embed_page({
                    embed: page_array_pgp[0]
                }, page_array_pgp);
            } else {
                return;
            }

        }
    }

    switch (command.trim()) {
        case "eval":
            if (message.author.id === "453840514022899712") {
                try {
                    var code = argument;
                    var evaled = eval(code);
                    if (typeof evaled === "Promise" && additions.indexOf("inspect") >= 0) {
                        evaled.then(
                            function() {
                                message.channel.sendCode("xl", evaled);
                                evaled = undefined;
                            }
                        ).err(console.error)
                        //evaled= eval("function(message){return "+code+";}").apply(this,[message]);
                    } else if (typeof evaled !== "string" && (evaled !== undefined)) {
                        if (additions.indexOf("inspect") >= 0) {
                            evaled = require("util").inspect(evaled);
                            message.channel.sendCode("xl", clean(evaled));
                        }
                    } else if (additions.indexOf("inspect") >= 0) {
                        message.channel.sendCode("xl", evaled);
                    }
                    if (additions.indexOf("fancy") >= 0) {
                        let URL = "https://images-ext-2.discordapp.net/eyJ1cmwiOiJodHRwOi8vd3d3Lm1hY2Vyb2JvdGljcy5jb20vd3AtY29udGVudC91cGxvYWRzLzIwMTYvMDIvZ2Vhci10b29scy5wbmcifQ.lc8Zq4vmjQ57Evm_VfbYnVpqdIw";
                        let embed = new Discord.RichEmbed();
                        embed.setColor("#0FF0FF");
                        embed.setThumbnail(URL);
                        embed.addField("Input", code);
                        embed.addField("Output", require("util").inspect(evaled));
                        message.channel.sendEmbed(embed).then(function() {
                            message.delete();
                        });
                    }
                    if (additions.indexOf("r") >= 0 && message) {
                        message.delete();
                    }
                } catch (err) {
                    message.channel.send(`\`ERROR\` \`\`\`xl\n${clean(err)}\n\`\`\``);
                    message.delete();
                }
            }
            break;
        case "invite":
            message.channel.send("https://discordapp.com/oauth2/authorize?permissions=93184&scope=bot&client_id=639271772818112564");
            break;
        case "github":
            message.channel.send("https://github.com/anclint01/LDS-Bot");
            break;
    }

});
bot.login(process.env.BOT_TOKEN);
