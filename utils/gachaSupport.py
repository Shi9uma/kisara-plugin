# -*- coding: utf-8 -*-
# 源码参考于 https://github.com/MSIsunny/GenshinWishCalculator-py/blob/main/WishSupport.py

'''
举例

输入：150 3 0 0 1 0 0 0

表示输入条件为：
当前有 150 抽
期望抽到 3 次限定角色(注意从无到 6 命需要 7 次限定金)
角色池已垫 0 抽
当前角色池 不是 大保底
期望抽到 1 个限定定轨武器
武器池已垫 0 抽
当前武器池 不是 大保底
命定值为 0

表示最终想要达成的条件为：
根据输入数据的 150 抽能达到抽到 3 次限定角色和 1 次限定定轨武器

能够 150 抽达成条件概率为：0.33%
267 抽内达成条件的概率为 10%
321 抽内达成条件的概率为 25%
384 抽内达成条件的概率为 50%
450 抽内达成条件的概率为 75%
508 抽内达成条件的概率为 90%
'''

_IntertwinedFateNum = 13    # 屯屯鼠改这个
DEFAULT = [
    _IntertwinedFateNum,
    6,
    77,
    1,
    1,
    61,
    0,
    0
]

# DEFAULT = [
#     1,
#     2,
#     68,
#     0,
#     1,
#     40,
#     0,
#     0
# ]

import numpy as np
import argparse
import sys
ap = argparse.ArgumentParser()
ap.add_argument('--IntertwinedFateNum', type=int, help='当前拥有的抽数')
ap.add_argument('--ExpectedCharacterNum', type=int, help='期望抽到限定角色次数, 0-7')
ap.add_argument('--CharacterPoolStage', type=int, help='当前角色池已垫抽数, 0-89')
ap.add_argument('--CharacterPoolGuarantee', type=int, help='当前角色池是否为大保底, 0/1')
ap.add_argument('--ExpectedWeaponNum', type=int, help='期望抽到限定定轨武器次数, 0-5')
ap.add_argument('--WeaponPoolStage', type=int, help='当前武器池已垫抽数, 0-79')
ap.add_argument('--WeaponPoolGuarantee', type=int, help='当前武器池是否为大保底, 0/1')
ap.add_argument('--BindingNum', type=int, help='当前角色池的命定值, 0-2')
ap.add_argument('-i', '--isCal', default=False, action='store_true', help='先 不指定 生成 cli 调用式, 再 指定 启动计算程序')

args = vars(ap.parse_args())

IntertwinedFateNum = args['IntertwinedFateNum']
ExpectedCharacterNum = args['ExpectedCharacterNum']
CharacterPoolStage = args['CharacterPoolStage']
CharacterPoolGuarantee = args['CharacterPoolGuarantee']
ExpectedWeaponNum = args['ExpectedWeaponNum']
WeaponPoolStage = args['WeaponPoolStage']
WeaponPoolGuarantee = args['WeaponPoolGuarantee']
BindingNum = args['BindingNum']
isCal = args['isCal']

banner1 = '''
输入条件为：
当前有 {} 抽
期望抽到 {} 次限定角色(注意从无到 6 命需要 7 次限定金)
角色池已垫 {} 抽
当前角色池 {} 大保底
期望抽到 {} 个限定定轨武器
武器池已垫 {} 抽
当前武器池 {} 大保底
命定值为 {}
'''

banner2 = '''
想要达成的条件为：
根据输入数据的 {} 抽能达到抽到 {} 次限定角色和 {} 次限定定轨武器
'''

banner3 = '''
能够 {} 抽达成条件概率为：{}%
{} 抽内达成条件的概率为 10%
{} 抽内达成条件的概率为 25%
{} 抽内达成条件的概率为 50%
{} 抽内达成条件的概率为 75%
{} 抽内达成条件的概率为 90%
'''

def main():
    #单次抽卡的概率
    #角色池
    def percent_character(x):
        if x <=73:
            return 0.006
        elif x <= 89:
            return (0.006+0.06*(x-73))
        else:
            return 1
    #武器池
    def percent_weapon(x):
        if x <=62:
            return 0.007
        elif x <= 73:
            return (0.007+0.07*(x-62))
        elif x <= 79:
            return (0.777+0.035*(x-73))
        else:
            return 1
    #初始化一个零矩阵
    size = 180*ExpectedCharacterNum+400*ExpectedWeaponNum+1 #这里加上1是为了让最后一行表示达成抽卡预期的状态
    TPmatrix = np.zeros((size, size))
    #角色池的初始状态设置
    CharacterPoolOffset = 0
    if ExpectedCharacterNum != 0:
        if CharacterPoolGuarantee == False:
            CharacterPoolOffset = CharacterPoolStage
        elif CharacterPoolGuarantee == True:
            CharacterPoolOffset = CharacterPoolStage+90
    #生成转移概率矩阵（矩阵前面的行是武器，后面的行是角色，最后一行表示的状态是已经达成抽卡预期）
    #这一部分代码生成抽武器的状态，如果要抽的武器数为0，那么就不会运行这一部分代码
    for i in range(0, ExpectedWeaponNum):
        offset = 400*i
        for j in range(0, 80):
            x = j % 80 + 1
            if i == ExpectedWeaponNum-1:
                #该行属于要抽的最后一把武器的部分，那么如果出限定就会进入角色部分，要加上角色池的初始偏移量
                TPmatrix[offset+j, offset+400+CharacterPoolOffset] = percent_weapon(x)*0.375
            else:
                #该行不属于要抽的最后一把武器的部分，那么抽完会进入下一把武器
                TPmatrix[offset+j, offset+400] = percent_weapon(x)*0.375
            TPmatrix[offset+j, offset+160] = percent_weapon(x)*0.375
            TPmatrix[offset+j, offset+240] = percent_weapon(x)*0.25
            TPmatrix[offset+j, offset+j+1] = 1-percent_weapon(x)
        for j in range(80, 160):
            x = j % 80 + 1
            if i == ExpectedWeaponNum-1:
                TPmatrix[offset+j, offset+400+CharacterPoolOffset] = percent_weapon(x)*0.5
            else:
                TPmatrix[offset+j, offset+400] = percent_weapon(x)*0.5
            TPmatrix[offset+j, offset+160] = percent_weapon(x)*0.5
            #在p159状态下抽卡必定成功，故一定会转移到p160状态，这里加上条件判断是为了避免覆盖前面的代码
            if j != 159:
                TPmatrix[offset+j, offset+j+1] = 1-percent_weapon(x)
        for j in range(160, 240):
            x = j % 80 + 1
            if i == ExpectedWeaponNum-1:
                TPmatrix[offset+j, offset+400+CharacterPoolOffset] = percent_weapon(x)*0.375
            else:
                TPmatrix[offset+j, offset+400] = percent_weapon(x)*0.375
            TPmatrix[offset+j, offset+320] = percent_weapon(x)*0.625
            TPmatrix[offset+j, offset+j+1] = 1-percent_weapon(x)
        for j in range(240, 320):
            x = j % 80 + 1
            if i == ExpectedWeaponNum-1:
                TPmatrix[offset+j, offset+400+CharacterPoolOffset] = percent_weapon(x)*0.5
            else:
                TPmatrix[offset+j, offset+400] = percent_weapon(x)*0.5
            TPmatrix[offset+j, offset+320] = percent_weapon(x)*0.5
            if j != 319:
                TPmatrix[offset+j, offset+j+1] = 1-percent_weapon(x)
        for j in range(320, 400):
            x = j % 80 + 1
            if i == ExpectedWeaponNum-1:
                TPmatrix[offset+j, offset+400+CharacterPoolOffset] = percent_weapon(x)
            else:
                TPmatrix[offset+j, offset+400] = percent_weapon(x)
            if j != 399:
                TPmatrix[offset+j, offset+j+1] = 1-percent_weapon(x)
    #这一部分代码生成抽角色的状态，如果要抽的角色数为0，那么就不会运行这一部分代码
    for i in range(0, ExpectedCharacterNum):
        offset = 180*i+ExpectedWeaponNum*400
        for j in range(0, 90):
            x = j % 90 + 1
            TPmatrix[offset+j, offset+180] = percent_character(x)*0.5
            TPmatrix[offset+j, offset+90] = percent_character(x)*0.5
            if j != 89:
                TPmatrix[offset+j, offset+j+1] = 1-percent_character(x)
        for j in range(90, 180):
            x = j % 90 + 1
            TPmatrix[offset+j, offset+180] = percent_character(x)
            if j != 179:
                TPmatrix[offset+j, offset+j+1] = 1-percent_character(x)
    #最后一行表示已经达成抽卡预期，所以从该状态到其他状态的概率都是0，到自身的概率为1
    TPmatrix[size-1, size-1] = 1
    #生成初始状态向量，如果抽武器，那么和武器池水位有关，否则和角色池水位有关
    initVector = np.zeros((size))
    if ExpectedWeaponNum != 0:
        if BindingNum == 0:
            if WeaponPoolGuarantee == False:
                initVector[WeaponPoolStage] = 1
            elif WeaponPoolGuarantee == True:
                initVector[WeaponPoolStage+80] = 1
        elif BindingNum == 1:
            if WeaponPoolGuarantee == False:
                initVector[WeaponPoolStage+160] = 1
            elif WeaponPoolGuarantee == True:
                initVector[WeaponPoolStage+240] = 1
        elif BindingNum == 2:
            initVector[WeaponPoolStage+320] = 1
    else:#这里是不抽武器的情况，和角色池水位有关
        initVector[CharacterPoolOffset] = 1
    #存储达到10%、25%、50%、75%、90%概率时的抽数
    percent10num = 0
    percent25num = 0
    percent50num = 0
    percent75num = 0
    percent90num = 0
    #存储达到预期次数的概率
    percentRes = -1
    resultVector = initVector
    for i in range(0, 1500):
        #将初始状态向量和转移概率矩阵不断相乘，相乘的次数为抽数，得到预期次数后状态的概率分布
        resultVector = resultVector@TPmatrix
        result = resultVector[size-1]
        if i == IntertwinedFateNum - 1:
            percentRes = result
        if result > 0.1 and percent10num == 0:
            percent10num = i+1
        if result > 0.25 and percent25num == 0:
            percent25num = i+1
        if result > 0.5 and percent50num == 0:
            percent50num = i+1 
        if result > 0.75 and percent75num == 0:
            percent75num = i+1
        if result > 0.9 and percent90num == 0:
            percent90num = i+1
        if percent90num != 0 and percentRes != -1:
            break
    #输出所有结果
    # print(np.round(percentRes*100,2))
    # print(percent10num)
    # print(percent25num)
    # print(percent50num)
    # print(percent75num)
    # print(percent90num)
    percentRes = str(np.round(percentRes*100,2))
    print(banner1.format(IntertwinedFateNum, ExpectedCharacterNum, CharacterPoolStage, '是' if CharacterPoolGuarantee else '不是', ExpectedWeaponNum, WeaponPoolStage, '是' if WeaponPoolGuarantee else '不是', BindingNum), end = '')
    print(banner2.format(IntertwinedFateNum, ExpectedCharacterNum, ExpectedWeaponNum), end = '')
    print(banner3.format(IntertwinedFateNum, percentRes, percent10num, percent25num, percent50num, percent75num, percent90num), end = '')
    sys.stdout.flush()

def printf(IntertwinedFateNum = IntertwinedFateNum, ExpectedCharacterNum = ExpectedCharacterNum, CharacterPoolStage = CharacterPoolStage, CharacterPoolGuarantee = CharacterPoolGuarantee, ExpectedWeaponNum = ExpectedWeaponNum, WeaponPoolStage = WeaponPoolStage, WeaponPoolGuarantee = WeaponPoolGuarantee, BindingNum = BindingNum):
    print('python {} -i --IntertwinedFateNum={} --ExpectedCharacterNum={} --CharacterPoolStage={} --CharacterPoolGuarantee={} --ExpectedWeaponNum={} --WeaponPoolStage={} --WeaponPoolGuarantee={} --BindingNum={}'.format(__file__, IntertwinedFateNum, ExpectedCharacterNum, CharacterPoolStage, CharacterPoolGuarantee, ExpectedWeaponNum, WeaponPoolStage, WeaponPoolGuarantee, BindingNum))

if isCal:
    main()
else:
    printf(DEFAULT[0], DEFAULT[1], DEFAULT[2], DEFAULT[3], DEFAULT[4], DEFAULT[5], DEFAULT[6], DEFAULT[7])