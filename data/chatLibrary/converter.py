# -*- coding: utf-8 -*-

import csv
import json
import os

WORKDIR = os.getcwd()
RAWDATADIR = '{}/raw'.format(WORKDIR)
OUTPUTDATADIR = '{}/lib'.format(WORKDIR)

csvFileList = os.listdir(RAWDATADIR)
jsonData = []

for fileName in csvFileList:
    csvFilePath = os.path.join(RAWDATADIR, fileName)
    with open(csvFilePath, encoding='utf-8') as fd:
        csvReader = csv.DictReader(fd)
        for row in csvReader:
            jsonData.append(row)

    jsonDict = {}
    for items in jsonData:
        if (items.get('reg') in jsonDict):
            tempList = jsonDict[items.get('reg')]
            tempList.append(items.get('reply'))
            jsonDict[items.get('reg')] = tempList
        else:
            tempReplyList = [items.get('reply')]
            jsonDict[items.get('reg')] = tempReplyList


    jsonFilePath = os.path.join(OUTPUTDATADIR, fileName.replace('.csv', '.json'))
    with open(jsonFilePath, 'w', encoding='utf-8') as fd:
        jsonStringify = json.dumps(jsonDict, indent = 4, ensure_ascii = False)
        fd.write(jsonStringify)
    
    print('转换已完成，raw 文件：{} => {}'.format(csvFilePath, jsonFilePath))