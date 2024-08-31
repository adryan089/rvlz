export interface NodeInfo {
    status: number
    message: string
    data: Data
  }
  
  export interface Data {
    totalNode: number
    nodeActive: number
    nodes: Node[]
    myRanking: number
  }
  
  export interface Node {
    _id: string
    walletAddress: string
    ipfsMultiAddress: any[]
    ipfsDbAddress: string
    peerID: string
    verified: boolean
    cpuUsage: number
    storageUsage: number
    ramUsage: number
    type: string
    upTimePerDay: number
    totalCpuCore: number
    cpuGhz: number
    cpuGhzMax: number
    totalRamSize: number
    ramMhz: number
    internetSpeed: number
    storageType: string
    currentPoint: number
    withdrawnPoint: number
    pingNumberPerDay: number
    totalMinuteRun: number
    lastPing: string
    createdAt: string
    updatedAt: string
    __v: number
  }
  