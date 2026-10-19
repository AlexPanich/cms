<nav class="navbar navbar-default">
    <div class="container">
        <a class="navbar-brand" href="{{ route('index') }}">Главная страница</a>
        <ul class="nav navbar-nav">
            @can('edit_pages')
            <li class="dropdown">
                <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">Страницы <span class="caret"></span></a>
                <ul class="dropdown-menu">
                    <li><a href="{{ route('all_pages') }}">Все</a></li>
                    <li><a href="{{ route('create_page') }}">Создать</a></li>
                </ul>
            </li>
            @endcan
            @can('edit_menus')
            <li class="dropdown">
                <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">Меню <span class="caret"></span></a>
                <ul class="dropdown-menu">
                    <li><a href="{{ route('all_menu') }}">Все</a></li>
                    <li><a href="{{ route('create_menu') }}">Создать</a></li>
                </ul>
            </li>
            @endcan
            @can('edit_galleries')
            <li class="dropdown">
                <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">Галереи <span class="caret"></span></a>
                <ul class="dropdown-menu">
                    <li><a href="{{ route('gallery') }}">Все</a></li>
                    <li><a href="{{ route('create_gallery') }}">Создать</a></li>
                </ul>
            </li>
            @endcan
            @can('edit_users')
            <li class="dropdown">
                <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">Пользователи <span class="caret"></span></a>
                <ul class="dropdown-menu">
                    <li><a href="{{ route('all_users') }}">Все</a></li>
                    <li><a href="{{ route('create_user') }}">Создать</a></li>
                </ul>
            </li>
            @endcan
            @can('edit_roles')
            <li class="dropdown">
                <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">Роли <span class="caret"></span></a>
                <ul class="dropdown-menu">
                    <li><a href="{{ route('all_roles') }}">Все</a></li>
                    <li><a href="{{ route('create_role') }}">Создать</a></li>
                </ul>
            </li>
            @endcan
            @can('edit_articles')
            <li class="dropdown">
                <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">Статьи <span class="caret"></span></a>
                <ul class="dropdown-menu">
                    <li><a href="{{ route('all_articles') }}">Все</a></li>
                    <li><a href="{{ route('create_article') }}">Создать</a></li>
                </ul>
            </li>
            @endcan
            @can('edit_templates')
            <li class="dropdown">
                <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">Шаблоны <span class="caret"></span></a>
                <ul class="dropdown-menu">
                    <li><a href="{{ route('all_templates') }}">Все</a></li>
                    <li><a href="{{ route('create_template') }}">Создать</a></li>
                </ul>
            </li>
            @endcan
            @can('edit_documents')
            <li class="dropdown">
                <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">Документы <span class="caret"></span></a>
                <ul class="dropdown-menu">
                    <li><a href="{{ route('all_documents') }}">Все</a></li>
                    <li><a href="{{ route('create_document') }}">Создать</a></li>
                </ul>
            </li>
            @endcan
            @can('edit_texts')
            <li class="dropdown">
                <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">Тексты <span class="caret"></span></a>
                <ul class="dropdown-menu">
                    <li><a href="{{ route('all_texts') }}">Все</a></li>
                    <li><a href="{{ route('create_text') }}">Создать</a></li>
                </ul>
            </li>
            @endcan
        </ul>
        @include('user_block')
    </div><!-- /.container-fluid -->
</nav>