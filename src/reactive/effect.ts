import { Fn } from "../shared/types";

export type ActiveEffect = Fn | null

let activeEffect: ActiveEffect = null