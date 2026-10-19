@inject('text', 'App\Text')
<nav id="sidebar">
    <!-- Sidebar Scroll Container -->
    <div id="sidebar-scroll">
        <!-- Sidebar Content -->
        <!-- Adding .sidebar-mini-hide to an element will hide it when the sidebar is in mini mode -->
        <div class="sidebar-content">
            <!-- Side Header -->
            <div class="side-header side-content bg-white-op">
                <!-- Layout API, functionality initialized in App() -> uiLayoutApi() -->
                <button class="btn btn-link text-gray pull-right hidden-md hidden-lg" type="button" data-toggle="layout" data-action="sidebar_close">
                    <i class="fa fa-times"></i>
                </button>
                <!-- Themes functionality initialized in App() -> uiHandleTheme() -->
                <div class="btn-group pull-right">
                    <button class="btn btn-link text-gray dropdown-toggle" data-toggle="dropdown" type="button">
                        <i class="si si-drop"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-right font-s13 sidebar-mini-hide">
                        <li>
                            <a data-toggle="theme" data-theme="default" tabindex="-1" href="javascript:void(0)">
                                <i class="fa fa-circle text-default pull-right"></i> <span class="font-w600">Default</span>
                            </a>
                        </li>
                        <li>
                            <a data-toggle="theme" data-theme="assets/css/themes/amethyst.min.css" tabindex="-1" href="javascript:void(0)">
                                <i class="fa fa-circle text-amethyst pull-right"></i> <span class="font-w600">Amethyst</span>
                            </a>
                        </li>
                        <li>
                            <a data-toggle="theme" data-theme="assets/css/themes/city.min.css" tabindex="-1" href="javascript:void(0)">
                                <i class="fa fa-circle text-city pull-right"></i> <span class="font-w600">City</span>
                            </a>
                        </li>
                        <li>
                            <a data-toggle="theme" data-theme="assets/css/themes/flat.min.css" tabindex="-1" href="javascript:void(0)">
                                <i class="fa fa-circle text-flat pull-right"></i> <span class="font-w600">Flat</span>
                            </a>
                        </li>
                        <li>
                            <a data-toggle="theme" data-theme="assets/css/themes/modern.min.css" tabindex="-1" href="javascript:void(0)">
                                <i class="fa fa-circle text-modern pull-right"></i> <span class="font-w600">Modern</span>
                            </a>
                        </li>
                        <li>
                            <a data-toggle="theme" data-theme="assets/css/themes/smooth.min.css" tabindex="-1" href="javascript:void(0)">
                                <i class="fa fa-circle text-smooth pull-right"></i> <span class="font-w600">Smooth</span>
                            </a>
                        </li>
                    </ul>
                </div>
                <a class="h5 text-white" href="{{ route('index') }}">
                    <span class="h4 font-w600 sidebar-mini-hide">{{ $text->getByAlias('title')->body }}</span>
                </a>
            </div>
            <!-- END Side Header -->

            <!-- Side Content -->
            <div class="side-content">
                <ul class="nav-main">
                    <li>
                        <a class="active" href="{{ route('dashboard') }}"><i class="si si-speedometer"></i><span class="sidebar-mini-hide">Панель управления</span></a>
                    </li>
                    @can('edit_pages')
                    <li>
                        <a class="nav-submenu" data-toggle="nav-submenu" href="#"><i class="si si-docs"></i><span class="sidebar-mini-hide">Страницы</span></a>
                        <ul>
                            <li>
                                <a href="{{ route('all_pages_tree') }}">Все страницы (дерево)</a>
                            </li>
                            <li>
                                <a href="{{ route('all_pages') }}">Список</a>
                            </li>
                            <li>
                                <a href="{{ route('create_page') }}">Добавить новую</a>
                            </li>
                        </ul>
                    </li>
                    @endcan
                    @can('edit_menus')
                    <li>
                        <a class="nav-submenu" data-toggle="nav-submenu" href="#"><i class="si si-list"></i><span class="sidebar-mini-hide">Меню</span></a>
                        <ul>
                            <li>
                                <a href="{{ route('all_menu') }}">Все меню</a>
                            </li>
                            <li>
                                <a href="{{ route('create_menu') }}">Добавить новое</a>
                            </li>
                        </ul>
                    </li>
                    @endcan
                    @can('edit_galleries')
                    <li>
                        <a class="nav-submenu" data-toggle="nav-submenu" href="#"><i class="si si-picture"></i><span class="sidebar-mini-hide">Галлереи</span></a>
                        <ul>
                            <li>
                                <a href="{{ route('gallery') }}">Все галереи</a>
                            </li>
                            <li>
                                <a href="{{ route('create_gallery') }}">Добавить новую</a>
                            </li>
                        </ul>
                    </li>
                    @endcan
                    @can('edit_users')
                    <li>
                        <a class="nav-submenu" data-toggle="nav-submenu" href="#"><i class="si si-user"></i><span class="sidebar-mini-hide">Пользователи</span></a>
                        <ul>
                            <li>
                                <a href="{{ route('all_users') }}">Все пользователи</a>
                            </li>
                            <li>
                                <a href="{{ route('create_user') }}">Добавить нового</a>
                            </li>
                        </ul>
                    </li>
                    @endcan
                    @can('edit_roles')
                    <li>
                        <a class="nav-submenu" data-toggle="nav-submenu" href="#"><i class="si si-moustache"></i><span class="sidebar-mini-hide">Роли</span></a>
                        <ul>
                            <li>
                                <a href="{{ route('all_roles') }}">Все роли</a>
                            </li>
                            <li>
                                <a href="{{ route('create_role') }}">Добавить новую</a>
                            </li>
                        </ul>
                    </li>
                    @endcan
                    @can('edit_templates')
                    <li>
                        <a class="nav-submenu" data-toggle="nav-submenu" href="#"><i class="si si-frame"></i><span class="sidebar-mini-hide">Шаблоны</span></a>
                        <ul>
                            <li>
                                <a href="{{ route('all_templates') }}">Все шаблоны</a>
                            </li>
                            <li>
                                <a href="{{ route('create_template') }}">Добавить новый</a>
                            </li>
                        </ul>
                    </li>
                    @endcan
                    @can('edit_documents')
                    <li>
                        <a class="nav-submenu" data-toggle="nav-submenu" href="#"><i class="si si-briefcase"></i><span class="sidebar-mini-hide">Документы</span></a>
                        <ul>
                            <li>
                                <a href="{{ route('all_documents') }}">Все документы</a>
                            </li>
                            <li>
                                <a href="{{ route('create_document') }}">Добавить новый</a>
                            </li>
                        </ul>
                    </li>
                    @endcan
                    @can('edit_texts')
                    <li>
                        <a class="nav-submenu" data-toggle="nav-submenu" href="#"><i class="si si-book-open"></i><span class="sidebar-mini-hide">Тексты</span></a>
                        <ul>
                            <li>
                                <a href="{{ route('all_texts') }}">Все тексты</a>
                            </li>
                            <li>
                                <a href="{{ route('create_text') }}">Добавить новый</a>
                            </li>
                        </ul>
                    </li>
                    @endcan
                    @can('edit_articles')
                    <li>
                        <a class="nav-submenu" data-toggle="nav-submenu" href="#"><i class="si si-notebook"></i><span class="sidebar-mini-hide">Статьи</span></a>
                        <ul>
                            <li>
                                <a href="{{ route('all_articles') }}">Все статьи</a>
                            </li>
                            <li>
                                <a href="{{ route('create_article') }}">Добавить новую</a>
                            </li>
                        </ul>
                    </li>
                    @endcan

                </ul>
            </div>
            <!-- END Side Content -->
        </div>
        <!-- Sidebar Content -->
    </div>
    <!-- END Sidebar Scroll Container -->
</nav>