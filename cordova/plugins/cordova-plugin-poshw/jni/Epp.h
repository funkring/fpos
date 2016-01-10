/******************************************************************************
 * ped.h
 * 
 * Copyright (c) 2010 
 * 
 * DESCRIPTION: - 
 * 
 * Modification history
 * ----------------------------------------------------------------------------
 * Date         Version  Author       History
 * ----------------------------------------------------------------------------
 * 
 ******************************************************************************/

#ifndef _POS_EPP_H_
#define _POS_EPP_H_

#include <stdint.h>
#include <sys/types.h>


#ifndef BYTE
#define BYTE unsigned char
#endif

#ifndef WORD
#define WORD unsigned short
#endif

#ifndef DWORD
#define DWORD unsigned long
#endif

#ifndef uchar
#define uchar unsigned char
#endif



#undef NULL
#ifdef __cplusplus
#define		NULL		0
#else
#define		NULL		((void*)0)
#endif


#ifdef __cplusplus
extern "C" {
#endif /* __cplusplus */

#define KEY_TYPE_MASTER      0x01
#define KEY_TYPE_MAC         0x02
#define KEY_TYPE_PIN         0x03
#define KEY_TYPE_DUKPT_MAC   0x04
#define KEY_TYPE_DUKPT_PIN   0x05
#define KEY_TYPE_FIXED_MAC   0x10
#define KEY_TYPE_FIXED_PIN   0x11

#define EPPINFO_PRODUCT_NAME    0x00
#define EPPINFO_HW_VER          0x01
#define EPPINFO_HW_CFG          0x02
#define EPPINFO_EPP_SN          0x03
#define EPPINFO_CPU_ID          0x04
#define EPPINFO_BOOT_VER        0x10
#define EPPINFO_KERNEL_VER      0x11
#define EPPINFO_PROTOCOL_VER    0x20


enum EPP_ERROR_CODE
{
    EPP_SUCCESS = 0,
    EPP_RECV_PACKET_ERROR=2001,
    EPP_PORT_OPEN_ERROR,
    EPP_SEND_PACKET_ERROR,  // 3
    EPP_PACKET_LEN_ERROR,
    EPP_RECV_TIMEOUT,  // 5
    EPP_PACKET_LEN_TOO_LONG,
    EPP_CRC_CHECK_ERROR,  // 7
    EPP_OPEN_FILE_ERROR,
    EPP_SEEK_FILE_ERROR,  // 9
    EPP_WRITE_FILE_ERROR,
    EPP_READ_FILE_ERROR,  // 11
    EPP_CONFIGURE_INVALID,
    EPP_CONFIGURE_MAC_ERROR,  // 13
    EPP_NO_PIN,  // User not input PIN on N20
    EPP_SEND_CMD_ERROR,  // 15
    EPP_RECV_CMD_ERROR,
    EPP_RECV_RET_ERROR,  // 17
    EPP_RECV_LEN_ERROR,
    EPP_MAC_CHECK_ERROR,  // 19
    EPP_AUTHEN_FAILED,
    EPP_INPUT_PARAM_ERROR,  // 21
    EPP_USER_PRESS_CANCEL,  // User press key cancel on NEW7110
    EPP_INPUT_CMD_ERROR,  // 23
    EPP_INPUT_KEY_INDEX_ERROR,
    EPP_INPUT_MAC_LEN_ERROR, // 25
    EPP_INPUT_MODE_ERROR,
    EPP_KEY_TYPE_ERROR,  // 27
    EPP_KEY_INDEX_ERROR,
    EPP_MASTER_KEY_INDEX_ERROR,  // 29
    EPP_BMP_ERROR,
    EPP_PIN_CFG_LANGE_TYPE_ERROR,  // 31
    EPP_PIN_CFG_SYMBOL_TYPE_ERROR,
    EPP_INPUT_DATA_LEN_ERROR, // 33
    EPP_SET_PORT_ERROR,
    EPP_CFG_ERROR, // 35
    EPP_CLOSE_FAILED,
    EPP_KSN_LEN_ERROR,
    EPP_GET_PIN_CHK_ERROR,
    EPP_GET_MAC_CHK_ERROR,
    EPP_GET_DES_CHK_ERROR,
    EPP_CMP_PIN_CHK_ERROR,
    EPP_CMP_MAC_CHK_ERROR,
    EPP_CMP_DES_CHK_ERROR,
    EPP_INJECT_PIN_KEY_ERROR,
    EPP_INJECT_MAC_KEY_ERROR,
    EPP_INJECT_DES_KEY_ERROR,
};


enum N20_RETURN_CODE{
    RET_ERROR_BASE = 2300,
    RET_PASSWORD_ERROR,  // 1
    RET_BOOT_LEN_ERROR,
    RET_BOOT_HASH_ERROR, // 3
    RET_BOOT_MAC_ERROR,
    RET_NOT_UBSK,  // 5
    RET_CHECK_UBSK_FAILED,
    RET_CHECK_KSK_FAILED,  // 7
    RET_NOT_LCK,
    RET_NOT_AUTH,  // 9
    RET_NOT_LOGON,
    RET_RECV_FAILED,  // 11
    RET_AUTH_CHECK_FAILED,
    RET_MAC_CHECK_FAILED,  // 13
    RET_CRC_CHECK_ERROR,
    RET_KVC_CHECK_ERROR,  // 15
    RET_NOT_APP_FREE_SPACE,
    RET_APP_NOT_EXIST,  // 17
    RET_KEY_TYPE_ERROR,
    RET_KEY_TYPE_NOT_SUPPORT,  // 19
    RET_MAC_LEN_ERROR,
    RET_MAIN_KEY_INDEX_ERROR,  // 21
    RET_MAIN_KEY_NOT_EXIST,
    RET_KEY_INDEX_ERROR,  // 23
    RET_KEY_LEN_ERROR,
    RET_KEY_BE_USE,  // 25
    RET_MAIN_KEY_BE_USE,  // 26
    RET_MAC_ALG_MODE_ERROR,
    RET_KEY_GET_ERROR,
    RET_KEY_OVER_FLOW,  // 29
    RET_KEY_SAME_ERROR,
    RET_KEY_NOT_EXIST,  // 31
    RET_KEY_MAC_CHECK_FAILED,
    RET_KEY_KSN_LEN_ERROR,  // 33
    RET_KEY_BDK_LEN_ERROR,
    RET_USER_PRESS_CANCEL_EXIT,  // 35 User press key cancel on N20
    RET_USER_INPUT_TIME_OUT,  // N20 wait user input timeout
    RET_KSN_LEN_RERROR,  // 37 N20 check KSN length error
    RET_APP_NUM_OVER_FLOW,  // N20 found that application number over flow
    RET_RW_LENGTH_ERROR,  // 39
    RET_PIN_KEY_TIME_LOCK,  // N20 check PIN key use frequent and upto the limit, N20 will lock for a moment
    RET_MAC_KEY_TIME_LOCK,  // 41 N20 check MAC key use frequent and upto the limit, N20 will lock for a moment
    RET_SET_PIN_TIME_OUT_ERROR,
    RET_WRITE_EEPROM_FAILED,  // 43
    RET_RECV_LEN_ERROR,
    RET_PARAM_ERROR,  // 45
    RET_NO_INPUT_PIN
};



typedef struct {
    BYTE AppName[32];
    BYTE Lck[16];
    BYTE Mtek[24];
    BYTE Akdak[16];
    BYTE Akuak[16];
    BYTE Mdtek[24];
    BYTE Mutek[24];
} EppAuthKey_t;  // 152 bytes

typedef struct {
    BYTE  KeyType;  /*密钥类型
                            0x01：主密钥；
                            0x02：MAC密钥；
                            0x03：PIN密钥；
                            0x10：Fixed MAC密钥；
                            0x11：Fixed PIN密钥；   */
    BYTE  Mode;/*
                         Bit0~3  TDEA_DECRYPT    0x00    采用解密方法得到明文目标Key
                                 TDEA_NONE       0x02    直接写入明文目标Key(对MAC key和PIN key无效)
                         Bit4~7  PARITY_NONE     0x00    对(解密后的)Key明文无校验
                                 PARITY_ODD      0x10    对(解密后的)Key明文进行奇校验
                                 PARITY_EVEN     0x20    对(解密后的)Key明文进行偶校验*/
    BYTE  KeyLen;  // 密钥长度，可取值8/16/24
    BYTE  KeyIndex;  // 密钥索引[1，100]
    BYTE  MasterKeyIndex; /*主密钥索引[1，100]，只有密钥类型是MAC密钥或者
                        PIN密钥的时候，该参数才有效*/
    BYTE  KeyData[24];  // 密钥内容
} EppAppKey_t;

typedef struct _EPP_CONFIGURE_ EPP_CFG;

/****************************************************************************
  函数名     :  EPP_CONFIGURE *epp_open(const char *filename, int oflag, ...)
  描述       :  打开密码键盘的设备口，对于NEW7110，设备名一般是“/dev/ttyS4”
                或者“/dev/ttyS4”，参数是O_RDWR
  输入参数   :  1、const char *filename ：密码键盘设备名
               2、int oflag ：打开的参数。O_RDWR
  输出参数   :  无
  返回值     :  失败则返回空指针，成功则返回打开后的配置句柄
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-15  V1.0         创建
****************************************************************************/
EPP_CFG *epp_open(const char *filename, int oflag);

/****************************************************************************
  函数名     :  int epp_close(EPP_CONFIGURE *cfg)
  描述       :  关闭密码键盘设备和释放资源
  输入参数   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
  输出参数   :  无
  返回值     :  0 / EPP_CLOSE_FAILED
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-15  V1.0         创建
****************************************************************************/
int epp_close(EPP_CFG *cfg);

/****************************************************************************
  函数名     :  int epp_init(EPP_CONFIGURE *cfg, const EppAuthKey_t *eppkey)
  描述       :  修改当前密钥配置，如果不使用默认配置，每次设备启动都要初始化配置；
                如果使用默认的配置，则无需调用此接口。
  输入参数   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
               2、const EppAuthKey_t *eppkey ：初始密钥信息
  输出参数   :  无
  返回值     :  0 / -1
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-15  V1.0         创建
****************************************************************************/
int epp_init(EPP_CFG *cfg, const EppAuthKey_t *eppkey);

/****************************************************************************
  函数名     :  int epp_download_lck_mtek(EPP_CONFIGURE *cfg)
  描述       :  将当前配置中的LCK和MTEK下载到N20上
                如果使用默认的配置，则无需调用此接口。
  输入参数   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
  输出参数   :  无
  返回值     :  EPP_SUCCESS / EPP_CFG_ERROR / EPP_SEND_CMD_ERROR / EPP_RECV_TIMEOUT / EPP_RECV_PACKET_ERROR
                 / EPP_PACKET_LEN_TOO_LONG / EPP_RECV_PACKET_ERROR / EPP_CRC_CHECK_ERROR
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-15  V1.0         创建
****************************************************************************/
int epp_download_lck_mtek(EPP_CFG *cfg);

/****************************************************************************
  函数名     :  int epp_download_aik(EPP_CONFIGURE *cfg)
  描述       :  将当前配置中的AIK下载到N20上
                如果使用默认的配置，则无需调用此接口。
  输入参数   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
  输出参数   :  无
  返回值     :  EPP_SUCCESS / EPP_CFG_ERROR / EPP_SEND_CMD_ERROR / EPP_RECV_TIMEOUT 
                / EPP_RECV_PACKET_ERROR / EPP_PACKET_LEN_TOO_LONG / EPP_RECV_PACKET_ERROR 
                / EPP_CRC_CHECK_ERROR / EPP_RECV_LEN_ERROR / EPP_AUTHEN_FAILED
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-15  V1.0         创建
****************************************************************************/
int epp_download_aik(EPP_CFG *cfg);

/****************************************************************************
  函数名     :  int epp_download_appkey(EPP_CONFIGURE *cfg, const EppAppKey_t *appkey)
  描述       :  下载应用密钥
  输入参数   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
               2、const EppAppKey_t *appkey ：要下载的密钥结构
  输出参数   :  无
  返回值     :  EPP_SUCCESS / EPP_CFG_ERROR / EPP_SEND_CMD_ERROR / EPP_RECV_TIMEOUT 
                / EPP_RECV_PACKET_ERROR / EPP_PACKET_LEN_TOO_LONG / EPP_RECV_PACKET_ERROR 
                / EPP_CRC_CHECK_ERROR / EPP_RECV_LEN_ERROR / EPP_AUTHEN_FAILED
                / EPP_KEY_TYPE_ERROR / EPP_MASTER_KEY_INDEX_ERROR / EPP_KEY_INDEX_ERROR
                / EPP_INPUT_DATA_LEN_ERROR / EPP_CFG_ERROR
  备注：如果下载的密钥需要主密钥来发散，那么主密钥的长度不能短于被发散的密钥长度。
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-15  V1.0         创建
****************************************************************************/
int epp_download_appkey(EPP_CFG *cfg, const EppAppKey_t *appkey);

/****************************************************************************
  函数名     :  int EppDownloadDukptKey(EPP_CFG *cfg, uint32_t KeyIndex,  const void *pBDK, const void *pKSN,
       uint32_t KSNLen)
  描述       :  应用DUKPT密钥下载
  输入参数   :  1、EPP_CFG *cfg ：EPP配置句柄指针
                2、uint32_t KeyIndex ：密钥索引，取值范围[1,32]
                3、void *pBDK ：16字节BDK输入，未被发散的BDK
                4、void *pKSN ：KSN内容
                5、uint32_t KSNLen ：KSN长度[1,10]
  输出参数   :  无
  返回值     :  EPP_SUCCESS/EPP_OPEN_FILE_ERROR/EPP_SEEK_FILE_ERROR/EPP_READ_FILE_ERROR/
                EPP_CONFIGURE_INVALID/EPP_CONFIGURE_MAC_ERROR/EPP_SEND_CMD_ERROR/
                EPP_RECV_CMD_ERROR/EPP_RECV_RET_ERROR/EPP_RECV_LEN_ERROR/EPP_AUTHEN_FAILED
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-06-08  V1.0         创建
****************************************************************************/
int epp_download_dukpt_key(EPP_CFG *cfg, uint32_t KeyIndex,  const void *pBDK, const void *pKSN,
       uint32_t KSNLen);

/****************************************************************************
  函数名     :  int epp_get_rand(EPP_CONFIGURE *cfg, void *pRandBuf, size_t size)
  描述       :  获取随机数
  输入参数   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
                2、void *pRandBuf ：存储随机数的数据缓冲，8字节
                3、size_t size ：缓冲大小
  输出参数   :  无
  返回值     :  EPP_SUCCESS / EPP_CFG_ERROR / EPP_SEND_CMD_ERROR / EPP_RECV_TIMEOUT 
                / EPP_RECV_PACKET_ERROR / EPP_PACKET_LEN_TOO_LONG / EPP_RECV_PACKET_ERROR 
                / EPP_CRC_CHECK_ERROR / EPP_RECV_LEN_ERROR / EPP_INPUT_PARAM_ERROR
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-15  V1.0         创建
****************************************************************************/
int epp_get_rand(EPP_CFG *cfg, void *pRandBuf, size_t size);

/****************************************************************************
  函数名     :  int epp_get_mac(EPP_CONFIGURE *cfg, uint32_t KeyType, uint32_t KeyIndex, 
                    uint32_t Mode, const void *pData, size_t DataLen, void *pMacOut)
  描述       :  请求MAC运算
  输入参数   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
                2、uint32_t KeyType ：密钥类型。KEY_TYPE_MAC/KEY_TYPE_FIXED_MAC/KEY_TYPE_DUKPT
                3、uint32_t KeyIndex ：MAC密钥索引，如果是MAC或者Fixed MAC可取值[1,100]，
                                     如果是DUKPT MAC则可取值[1,32]
                4、BYTE Mode ：运算算法选择
                                     0x00	算法1
                                     0x01	算法2
                                     0x02	EMV2000算法
                                     0x03	中国银联算法
                5、const void *pData ：参与运算的MAC数据
                6、size_t DataLen ：MAC数据长度，必须是8的整数倍，最小值为8，最大值为2024
  输出参数   :  1、void *pMacOut ：8字节MAC运算结果，如果命令码是DUKPT_MAC_KEY，则前8个字节
                   是MAC计算结果，后10个字节是当前KSN。
  返回值     :  EPP_SUCCESS / EPP_CFG_ERROR / EPP_SEND_CMD_ERROR / EPP_RECV_TIMEOUT 
                / EPP_RECV_PACKET_ERROR / EPP_PACKET_LEN_TOO_LONG / EPP_RECV_PACKET_ERROR 
                / EPP_CRC_CHECK_ERROR / EPP_RECV_LEN_ERROR / EPP_INPUT_PARAM_ERROR 
                / EPP_INPUT_CMD_ERROR / EPP_INPUT_KEY_INDEX_ERROR / EPP_INPUT_MAC_LEN_ERROR
                / EPP_INPUT_MODE_ERROR / 
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-15  V1.0         创建
****************************************************************************/
int epp_get_mac(EPP_CFG *cfg, uint32_t KeyType, uint32_t KeyIndex, uint32_t Mode,
				const void *pData, size_t DataLen, void *pMacOut);

/****************************************************************************
  函数名     :  int epp_get_pin(EPP_CONFIGURE *cfg, uint32_t KeyType, uint32_t KeyIndex, uint32_t DisplayMode, 
				uint32_t Mode, const void *pCardInfo, const void *pLenInfo, void *pPinBlockOut)
  描述       :  PIN运算API
  输入参数   :  1、EPP_CFG *cfg ：配置句柄指针
                2、uint32_t KeyType ：密钥类型。KEY_TYPE_PIN/KEY_TYPE_FIXED_PIN/KEY_TYPE_DUKPT
                3、uint32_t KeyIndex ：密钥索引，如果是PIN或者Fixed PIN可取值[1,100]，
                                     如果是DUKPT PIN则可取值[1,32]
                4、uint32_t DisplayMode ：PIN显示模式，0表示从左到右，1表示从右到左，2表示居中。
                5、uint32_t Mode ：运算算法选择，
                                        0x00表示选择“Format 0模式”算法，
                                        0x01表示选择“Format EMV模式”算法，
                                        0x0a表示选择“Format EPS模式”算法，
                6、const void *pCardInfo ：16卡号信息，缓冲长度必须不小于16字节
                7、const void *pLenInfo ：允许输入的PIN密钥长度枚举值字符串，长度可取值0,4~12，分
                            别用字符'0'，'4'，……，'9'，'a'，'b'，'c'表示。例如填入数据
                            "0456a\0\0\0\0\0\0\0\0"，则表示支持长度为0、4、5、6和10的PIN输入。
                            缓冲长度不小于13字节。
  输出参数   :  1、void *pPinBlockOut ：缓冲长度最小为19字节，前8字节是PIN运算结果；第九个
                   字节表示用户是否输入PIN，如果是0则表示没输入PIN，1表示有输入PIN；
                   如果是DUKPT，则接下来9~18字节是当前KSN
  返回值     :  
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-15  V1.0         创建
****************************************************************************/
int epp_get_pin(EPP_CFG *cfg, uint32_t KeyType, uint32_t KeyIndex, uint32_t DisplayMode,
				uint32_t Mode, const void *pCardInfo, const void *pLenInfo, void *pPinBlockOut);

/****************************************************************************
  函数名     :  int epp_get_tdea(EPP_CONFIGURE *cfg, uint32_t Mode, uint32_t KeyType, uint32_t KeyIndex,
				 const void *pDataIn, size_t DataLen,  void *pDataOut)
  描述       :  TDEA运算API
  输入参数   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
                2、uint32_t Mode ：算法模式
                                0x0000: ECB模式解密运算
                                0x0001: ECB模式加密运算
                                0x0100: CBC模式解密运算
                                0x0101: CBC模式加密运算
                3、uint32_t KeyType ：密钥类型。
                                0x01：主密钥；
                                0x02：MAC密钥；
                                0x03：PIN密钥；
                                0x04：DUKPT MAC密钥；暂不支持
                                0x05：DUKPT PIN密钥；暂不支持
                                0x10：Fixed MAC密钥；
                                0x11：Fixed PIN密钥；  
                4、uint32_t KeyIndex ：密钥索引，可取值[1,100]
                5、const void *pDataIn ：参与运算的数据
                6、size_t DataLen ：数据长度，必须是8的整数倍，最小值为8，最大值为96
  输出参数   :  1、void *pDataOut ：运算结果
  返回值     :  EPP_SUCCESS/EPP_SEND_CMD_ERROR/EPP_RECV_CMD_ERROR/EPP_RECV_RET_ERROR/
                EPP_RECV_LEN_ERROR/EPP_AUTHEN_FAILED/
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-11  V1.0         创建
****************************************************************************/
int epp_get_tdea(EPP_CFG *cfg, uint32_t Mode, uint32_t KeyType, uint32_t KeyIndex,
				 const void *pDataIn, size_t DataLen,  void *pDataOut);

/****************************************************************************
  函数名     :  int epp_set_pin_input_timeout(EPP_CONFIGURE *cfg, ulong TimeoutMs)
  描述       :  设置PIN输入超时时间长度。
  输入参数   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
                2、ulong TimeoutMs ：超时时间，单位是ms。
  输出参数   :  无
  返回值     :  
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-15  V1.0         创建
****************************************************************************/
int epp_set_pin_input_timeout(EPP_CFG *cfg, unsigned long TimeoutMs);

/****************************************************************************
  函数名     :  int epp_set_tdes_iv(EPP_CONFIGURE *cfg, const void *pIvData)
  描述       :  设置Tdes初始向量，该向量只对CBC算法有效
  输入参数   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
                2、const void *pIvData ：8字节的输入向量。
  输出参数   :  无
  返回值     :  
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-15  V1.0         创建
****************************************************************************/
int epp_set_tdes_iv(EPP_CFG *cfg, const void *pIvData);

/****************************************************************************
  函数名     :  int EppClearAKey(BYTE KeyType, BYTE KeyIndex)
  描述       :  清除某个密钥
  输入参数   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
                1、BYTE KeyType ：密钥类型
                                0x01：主密钥；
                                0x02：MAC密钥；
                                0x03：PIN密钥；
                                0x10：Fixed MAC密钥；
                                0x11：Fixed PIN密钥；  
                2、BYTE KeyIndex ：密钥索引
  输出参数   :  无
  返回值     :  
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-11  V1.0         创建
****************************************************************************/
int epp_clear_key(EPP_CFG *cfg, uint32_t KeyType, uint32_t KeyIndex);

/****************************************************************************
  函数名     :  int epp_clear_appkey(EPP_CONFIGURE *cfg)
  描述       :  清除当前应用的所有密钥。
  输入参数   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
  输出参数   :  无
  返回值     :  
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-15  V1.0         创建
****************************************************************************/
int epp_clear_appkey(EPP_CFG *cfg);

/****************************************************************************
  函数名     :  int epp_format_ped(EPP_CONFIGURE *cfg)
  描述       :  初始化（格式化）密码键盘，该操作会使EPP清除所有密钥，并恢复使用默认值。
  输入参数   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
  输出参数   :  无
  返回值     :  
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-15  V1.0         创建
****************************************************************************/
int epp_format_ped(EPP_CFG *cfg);

/****************************************************************************
  函数名     :  int epp_set_idle_logo(EPP_CONFIGURE *cfg, const void *pBmpIdleLogoIn)
  描述       :  更新IDLE LOGO。
  输入参数   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
                2、void *pBmpIdleLogoIn  ：单色BMP文件的数据内容。
                               如果是N20，则分辨率必须是122*32。
  输出参数   :  无
  返回值     :  
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-15  V1.0         创建
****************************************************************************/
int epp_set_idle_logo(EPP_CFG *cfg, const void *pBmpIdleLogoIn);

/****************************************************************************
  函数名     :  int epp_resume_default_idle_logo(EPP_CONFIGURE *cfg)
  描述       :  回复出厂默认的IDLE LOGO。
  输入参数   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
  输出参数   :  无
  返回值     :  
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-15  V1.0         创建
****************************************************************************/
int epp_resume_default_idle_logo(EPP_CFG *cfg);

/****************************************************************************
  函数名     :  int epp_display_logo(EPP_CFG *cfg, const void *pBmpLogoIn)
  描述       :  在液晶屏上显示图标信息
  输入参数   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
                2、const void *pBmpLogoIn ：单色BMP图，最大为122x32
  输出参数   :  无
  返回值     :  
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-15  V1.0         创建
****************************************************************************/
int epp_display_logo(EPP_CFG *cfg, uint32_t X, uint32_t Y, const void *pBmpLogoIn);

/****************************************************************************
  函数名     :  int epp_display_string(EPP_CONFIGURE *cfg, int X, int Y, int iMode, const void *str, int iStrLen)
  描述       :  在屏幕上显示字符串，目前n20只能显示ASCII字符
  输入参数   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
                2、int X ：显示位置x
                3、int Y ：显示位置y
                4、int iMode ：显示字符的大小8:6x8;16:8x16
                5、const void *str ：显示的字符串
                6、int iStrLen ：字符串的长度
  输出参数   :  无
  返回值     :  
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-15  V1.0         创建
****************************************************************************/
int epp_display_string(EPP_CFG *cfg, uint32_t X, uint32_t Y, uint32_t iMode, 
                const void *str, uint32_t iStrLen);

/****************************************************************************
  函数名     :  int epp_clear_screen(EPP_CONFIGURE *cfg)
  描述       :  清除屏幕显示。
  输入参数   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
  输出参数   :  无
  返回值     :  
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-15  V1.0         创建
****************************************************************************/
int epp_clear_screen(EPP_CFG *cfg);

int epp_enter_factory_test(EPP_CFG *cfg, BYTE bySpeed);

/****************************************************************************
  函数名     :  int epp_get_system_info(EPP_CONFIGURE *cfg, uint32_t Type, void *pvInfoOut)
  描述       :  获取EPP信息。
  输入参数   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
                2、uint32_t Type ：查询类别；
                          0x00硬件版本；
                          0x01硬件配置； 
                          0x02 机器序列号；
                          0x03 CPU SN；
                          0x10 boot版本；
                          0x11 Kernel版本；
                          0x20 查询协议版本；
                
  输出参数   :  1、void *pvInfoOut ：密码键盘返回的内容，缓冲至少17个字节。
  返回值     :  
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-15  V1.0         创建
****************************************************************************/
int epp_get_system_info(EPP_CFG *cfg, uint32_t Type, void *pvInfoOut);

/****************************************************************************
  函数名     :  int epp_beep(EPP_CFG *cfg, uint32_t Frequency, uint32_t TimeMs)
  描述       :  让Epp蜂鸣器鸣叫
  输入参数   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
                2、DWORD dwFrequency ：
                        频率控制参数。
                        (1)如果取值从0到6，则对应频率是1680, 1834, 2020, 2127, 2380, 2700, 2900；
                        (2)如果取值大于等于7，则按该值来设置频率，例如该值是1500，则频率是1500。
                        说明：该参数对于N20无意义，N20仅支持固定的2500hz的频率。
                3、DWORD dwTimeMs ：鸣叫时间长度，单位毫秒
  输出参数   :  无
  返回值     :  
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-15  V1.0         创建
****************************************************************************/
int epp_beep(EPP_CFG *cfg, uint32_t Frequency, uint32_t TimeMs);


/****************************************************************************
  函数名     :  int epp_light(EPP_CONFIGURE *cfg, int TimeMs)
  描述       :  Epp背光控制
  输入参数   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
                2、int TimeMs ：
                              <0:一直亮；
                              =0:一直灭；
                              >0:按指定的时间亮
                              该参数只有在模式1的时候才有效。   
  输出参数   :  无
  返回值     :  
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-11  V1.0         创建
****************************************************************************/
int epp_light(EPP_CFG *cfg, int TimeMs); 


/****************************************************************************
  函数名     :  int epp_kb_get_string(EPP_CONFIGURE *cfg, uint32_t iMode, uint32_t iMinLen, 
                   uint32_t iMaxlen, uint32_t iTimeOutMs, void *strBuff)
  描述       :  获取密码键盘上的用户按键输入
  输入参数   :  1、EPP_CONFIGURE *cfg ：配置句柄指针
                2、uint32_t iMode ：模式
                        D31 rev
                        …  rev
                        D9  rev
                        D8  1（0） 是（否）允许左对齐输入换行显示
                        D7  1（0） 是（否）StrBuf预设内容有效
                        D6  1（0） 大（小）字体
                        D5  1（0） 能（否）输数字
                        D4  1（0） 能（否）输字符
                        D3  1（0） 是（否）密码方式
                        D2  1（0） 左（右）对齐输入
                        D1  1（0） 有（否）小数点
                        D0  1（0） 正（反）显示
                3、uint32_t iMinLen ：最小长度
                4、uint32_t iMaxLen ：最大长度
                5、uint32_t iTimeOutMs ：超时时间
  输出参数   :  1、void *strBuff ：密码键盘返回的内容，缓冲由最大长度决定。
  返回值     :  
  修改历史   :
      修改人     修改时间    修改版本号   修改原因
  1、 黄俊斌     2010-12-15  V1.0         创建
****************************************************************************/
int epp_kb_get_string(EPP_CFG *cfg, uint32_t iMode, uint32_t iMinLen, 
              uint32_t iMaxlen, uint32_t iTimeOutMs, void *strBuff);

int epp_unlock_ped(EPP_CFG *cfg, BYTE *pbyUnlockKey);

#ifdef __cplusplus
}
#endif /* __cplusplus */

#endif /* _POS_EPP_H_ */

