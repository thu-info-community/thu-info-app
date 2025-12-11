import washerMap from "../assets/washers/washers"

const REMOVE_STRS = ["清华大学", "学生", "-", "公寓", "宿舍区",
                     "公", "宿舍", " ", "4g", "4G", "洗鞋机"];

export function getWasherLoaction(id: string) {
    let name = washerMap[id];
    if (name == null)
        return id;
    for (const s of REMOVE_STRS)
        name = name.replaceAll(s, "");
    return name;
}