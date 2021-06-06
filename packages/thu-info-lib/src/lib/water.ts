import {Water} from "../index"
import {WATER_SUB_URL, WATER_USER_URL} from '../constants/strings'
import {uFetch} from "../utils/network";

export interface WaterUserInformation {
    phone: string,
    address: string
} 

export const getUserInformation = (
    water: Water,
    id: string
): Promise<WaterUserInformation> => {
    water.id = id
    return uFetch(
        WATER_USER_URL, 
        undefined,
        {
            name: "pw",
            param: water.id
        }
    ).then(JSON.parse)
}

export const getUserInformationAndStore = (
    water: Water,
    id: string
): Promise<void> => {
    return getUserInformation(
        water,
        id
    ).then(res => {
        water.address = res.address
        water.phone = res.phone
    })
}

export const postWaterSubmission = (
    water: Water,
    num: string,
    num1: string,
    lid: string
): Promise<void> => 
    uFetch(
        WATER_SUB_URL,
        undefined,
        {
            pw: water.id, 
            num: num,
            num1: num1,
            lid: lid,
            address: water.address
        }
    ).then(res => {
        if(!res.includes("成功")) {
            throw new Error("Submitting failed")
        }
    })
