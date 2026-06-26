from pydantic import BaseModel, ConfigDict, Field


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    sku: str = Field(..., min_length=1, max_length=100)
    description: str | None = None
    price: float = Field(..., gt=0)
    cost: float = Field(..., ge=0)
    stock_quantity: int = Field(default=0, ge=0)
    reorder_threshold: int = Field(default=10, ge=0)
    category: str | None = None
    image_url: str | None = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    price: float | None = Field(default=None, gt=0)
    cost: float | None = Field(default=None, ge=0)
    stock_quantity: int | None = Field(default=None, ge=0)
    reorder_threshold: int | None = Field(default=None, ge=0)
    category: str | None = None
    image_url: str | None = None
    # SKU is intentionally excluded — it acts as a stable identifier


class ProductResponse(ProductBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
