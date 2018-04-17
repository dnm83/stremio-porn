class BaseAdapter {
  static SUPPORTED_TYPES = []

  constructor(httpClient) {
    this.httpClient = httpClient
  }

  _normalizeItem(item) {
    return item
  }

  _normalizeStream(stream) {
    if (stream.name) {
      return stream
    } else {
      return { ...stream, name: this.constructor.name }
    }
  }

  _paginate(request, itemsPerPage = this.constructor.ITEMS_PER_PAGE) {
    let {
      skip = 0,
      limit = itemsPerPage,
    } = request
    let firstPage = Math.ceil((skip + 0.1) / itemsPerPage) || 1
    let pageCount = Math.ceil(limit / itemsPerPage)
    let pages = []

    for (let i = firstPage; pages.length < pageCount; i++) {
      pages.push(i)
    }

    return {
      pages, skip, limit,
      skipOnFirstPage: skip % itemsPerPage,
    }
  }

  _validateRequest(request) {
    let type = typeof request
    let { SUPPORTED_TYPES } = this.constructor

    if (type !== 'object') {
      throw new Error(`A request must be an object, ${type} given`)
    }

    if (!request.query) {
      throw new Error('Request query must not be empty')
    }

    if (!SUPPORTED_TYPES.includes(request.query.type)) {
      throw new Error(`Content type ${request.query.type} is not supported`)
    }
  }

  async _find(query, pagination) {
    let {
      pages,
      limit = Infinity,
      skipOnFirstPage = 0,
    } = pagination

    let requests = pages.map((page) => {
      return this._findByPage(query, page)
    })

    let results = await Promise.all(requests)
    results = [].concat(...results)
    return results.slice(skipOnFirstPage, skipOnFirstPage + limit)
  }

  async find(request) {
    this._validateRequest(request)

    let pagination = this._paginate(request)
    let results = await this._find(request.query, pagination)
    return results.map((item) => this._normalizeItem(item))
  }

  async getItem(request) {
    this._validateRequest(request)

    let { type, id } = request.query
    let result = await this._getItem(type, id)
    return result ? [this._normalizeItem(result)] : []
  }

  async getStreams(request) {
    this._validateRequest(request)

    let { type, id } = request.query
    let results = await this._getStreams(type, id)
    return results.map((stream) => this._normalizeStream(stream))
  }
}


export default BaseAdapter