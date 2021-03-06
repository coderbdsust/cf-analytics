'use strict';

const STATE = {
    UNSENT: 0,
    OPENED: 1,
    HEADERS_RECEIVED: 2,
    LOADING: 3,
    DONE: 4
}

const STATUS = {
    UNSENT: 0,
    OPENED: 0,
    LOADING: 200,
    DONE: 200
};

const PROFILE_INFO_REQUEST = 'http://codeforces.com/api/user.info?handles=';
const SUBMISSION_INFO_REQUEST = 'http://codeforces.com/api/user.status?handle=';

function clearNode(node) {
    while (node.firstChild) {
        node.removeChild(node.firstChild);
    }
}

function constructDiv(content) {
    const newDiv = document.createElement('div'); 
    const newContent = document.createTextNode(content);
    newDiv.appendChild(newContent);
    return newDiv;
}

function constructTable(contentMap) {
    const newTable = document.createElement('table');

    for (const [key, value] of contentMap) {
        const row = newTable.insertRow(0);
        const cell1 = row.insertCell(0);
        const cell2 = row.insertCell(1);
        cell1.innerHTML = key;
        cell2.innerHTML = value;
    }
    
    return newTable;
}

function addImage(src) {
    const img = document.createElement('img');
    img.src = src;
    return img;
}

handleSubmit.onclick = function constructProfile() {
    const rootNode = document.getElementById('profileDiv');
    clearNode(rootNode);

    const handle = handleEntry.value;
    populateBasicInfo(rootNode, handle);
    populateSubmissionInfo(rootNode, handle);
}

function populateBasicInfo(rootNode, handle) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', PROFILE_INFO_REQUEST + handle, true);
    xhr.send();

    xhr.onreadystatechange = () => {
        if (xhr.readyState === STATE.DONE && xhr.status === STATUS.DONE) {
            const jsonObj = JSON.parse(xhr.response);
            rootNode.appendChild(addImage('https:' + jsonObj.result[0].titlePhoto));
            const ratingDiv = constructDiv('Rating: ' + jsonObj.result[0].rating);
            rootNode.appendChild(ratingDiv);
            const maxRatingDiv = constructDiv('Max. Rating: ' + jsonObj.result[0].maxRating);
            rootNode.appendChild(maxRatingDiv);
            const maxRankDiv = constructDiv('Max. Rank: ' + jsonObj.result[0].maxRank);
            rootNode.appendChild(maxRankDiv);
        } else {
            console.log(xhr.response);
        }
    }
}

function createString(key, value) {
    return key + value;
}

function populateSubmissionInfo(rootNode, handle) {
    const chunkSize = 500;
    let submissionsLeft = true;
    const okaySubmissionSet = new Set([]);
    const submissionTypeMap = new Map([]);
    const problemCategoryMap = new Map([]);

    function lazyConstruction(startSubmision) {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', SUBMISSION_INFO_REQUEST +
                        handle +
                        createString('&from=', startSubmision) +
                        createString('&count=', chunkSize), true);
        xhr.send();
        xhr.onreadystatechange = () => {
            if (xhr.readyState === STATE.DONE && xhr.status === STATUS.DONE) {
                const jsonObj = JSON.parse(xhr.response);
                if (jsonObj.result.length === 0) {
                    if (submissionsLeft === true) {
                        submissionsLeft = false;

                        const uniqueACDiv = constructDiv('Total Unique Solve: ' + okaySubmissionSet.size);
                        rootNode.appendChild(uniqueACDiv);

                        const verdictHeaderDiv = constructDiv('Verdict Table');
                        verdictHeaderDiv.style.color = "#F5AE20";
                        rootNode.appendChild(verdictHeaderDiv);
                        const submissionTypeDiv = constructTable(submissionTypeMap);
                        rootNode.appendChild(submissionTypeDiv);

                        const categoryHeaderDiv = constructDiv('Category-wise Solves');
                        categoryHeaderDiv.style.color = "#F5AE20";
                        rootNode.appendChild(categoryHeaderDiv);
                        const problemCategoryDiv = constructTable(problemCategoryMap);
                        rootNode.appendChild(problemCategoryDiv);                        
                    }
                } else {
                    jsonObj.result.forEach(submission => {
                        if (submission.verdict === 'OK') {
                            if (!okaySubmissionSet.has(submission.problem.name)) {
                                okaySubmissionSet.add(submission.problem.name);
                                submission.problem.tags.forEach(tag => {
                                    if (problemCategoryMap.has(tag)) {
                                        problemCategoryMap.set(tag, 1 + problemCategoryMap.get(tag));
                                    } else {
                                        problemCategoryMap.set(tag, 1);
                                    }
                                });
                            }
                        }
                        if (submissionTypeMap.has(submission.verdict)) {
                            submissionTypeMap.set(submission.verdict, 1 + submissionTypeMap.get(submission.verdict));
                        } else {
                            submissionTypeMap.set(submission.verdict, 1);
                        }
                    });
                    lazyConstruction(startSubmision + chunkSize);
                }
            } else {
                console.log(xhr.response);
            }
        }
    }

    lazyConstruction(1);
}
