export class PaginatorClass {
  public pagesCount: number
  public page: number
  public pageSize: number
  public totalCount: number
  public items: any

  constructor(pagesCount: number, pageSize: number, page: number, items: any) {
    this.pagesCount =  Math.ceil(pagesCount / pageSize),
      this.page = page,
      this.pageSize = pageSize,
      this.totalCount = pagesCount,
      this.items = items
  }
}