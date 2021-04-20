const cashView = {
  state: {
    cashViewList: []
  },
  mutations: {
    SET_CASH_VIEW: (state, cashViewList) => {
      state.cashViewList = cashViewList
    }
  }
}

export default cashView
