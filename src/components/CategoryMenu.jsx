import "../style/pages/categorymenu.scss";
import { Link } from "react-router-dom";

function CategoryMenu() {
    return (
        <div className="category-container">
            <button className="category-button">
                Danh mục sản phẩm
            </button>

            <ul className="category-dropdown">
                <li><Link to="/category/quan-ao">Quần áo</Link></li>
                <li><Link to="/category/giay-dep">Giày dép</Link></li>
                <li><Link to="/category/tui-xach">Túi xách</Link></li>
            </ul>
        </div>
    );
}

export default CategoryMenu;
