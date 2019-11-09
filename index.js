const cheerio = require('cheerio');
const worker = require('cloudflare-workers');

worker.get('/getAllIDs/:schoolID/:username/:password', async (request, context) => {


    const res = await fetch("https://dodea.gradespeed.net/pc/StudentLogin.aspx", {
        "headers": {
            "content-type": "application/x-www-form-urlencoded",
        },
        "body": `AuthType=Student&FormType=Login&DistrictID=3000010&SchoolID=${context.pathParams.schoolID}&Username=${context.pathParams.username}&Password=${atob(context.pathParams.password)}&cmdLogOn=Sign+In`,
        "method": "POST",
        "redirect": "manual"
    });

    if (res.status == 200){
        return new Response(["Error, Username/Password/SchoolID incorrect"]);
    }

    const res2 = await fetch("https://dodea.gradespeed.net/pc/ParentStudentGrades.aspx", {
        "headers": {
            "cookie": res.headers.get('set-cookie'),
        },
        "method": "GET",
        "redirect": "manual"
    });

    const body = await res2.text();
    const $ = cheerio.load(body);

    let grades = []

    $(".DataRow, .DataRowAlt").each(function () {
        let classData = [];
        $(this).find("th, td").each(function () {
            let content = $(this).html();
            let self = $(this);
            if (content.includes('class="Grade"') && content.includes('<a')){
                classData.push([$(this).find("a").attr("href"),$(this).text()]);
            } else {
                classData.push([$(this).text()]);
            }
            
        });
        grades.push(classData);
    });

    let headers = new Headers();
    headers.append("Access-Control-Allow-Origin", "*");
    return new Response(JSON.stringify(grades), {headers});
});


worker.get('/getClassBreakdown/:schoolID/:username/:password/:classID', async (request, context) => {


    const res = await fetch("https://dodea.gradespeed.net/pc/StudentLogin.aspx", {
        "headers": {
            "content-type": "application/x-www-form-urlencoded",
        },
        "body": `AuthType=Student&FormType=Login&DistrictID=3000010&SchoolID=${context.pathParams.schoolID}&Username=${context.pathParams.username}&Password=${atob(context.pathParams.password)}&cmdLogOn=Sign+In`,
        "method": "POST",
        "redirect": "manual"
    });

    if (res.status == 200){
        return new Response(["Error, Username/Password/SchoolID incorrect"]);
    }
    const res2 = await fetch(`https://dodea.gradespeed.net/pc/ParentStudentGrades.aspx?data=${context.pathParams.classID}`, {
        "headers": {
            "cookie": res.headers.get('set-cookie'),
        },
        "method": "GET",
        "redirect": "manual"
    });

    const body = await res2.text();
    let $ = cheerio.load(body);

    let grades = []

    $('.ClassName').nextAll('.DataTable').each(function () {
        var id = grades.length;
        grades[id] = [];

        grades[id].push([$(this).prev().prev().text()]);

        $(this).find("tr").each(function () {
            var iId = grades[id].length;
            grades[id][iId] = []
            $(this).find("td").each(function () {
                grades[id][iId].push($(this).text())
            });
        });
    });
    let headers = new Headers();
    headers.append("Access-Control-Allow-Origin", "*");
    return new Response(JSON.stringify(grades), {headers});
});

/**
 * Respond to the request
 * @param {Request} request
 */

addEventListener('fetch', function (event) {
    event.respondWith(worker.handleRequest(event));
});